import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  const token = parts[1];
  const verified = verifyToken(token);
  
  return verified;
}

export async function GET(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalConsultations,
      todayConsultations,
      activePrescriptions,
      totalPrescriptions,
      topMedications
    ] = await Promise.all([
      db.collection('consultations').countDocuments().catch(() => 0),
      db.collection('consultations').countDocuments({
        consultationDate: { $gte: today }
      }).catch(() => 0),
      db.collection('prescriptions').countDocuments({ status: 'active' }).catch(() => 0),
      db.collection('prescriptions').countDocuments().catch(() => 0),
      db.collection('prescriptions').aggregate([
        { $group: { _id: '$medication', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray().catch(() => [])
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalConsultations,
        todayConsultations,
        activePrescriptions,
        totalPrescriptions,
        topMedications
      }
    });
  } catch (error) {
    console.error('Outpatient stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch outpatient stats' },
      { status: 500 }
    );
  }
}