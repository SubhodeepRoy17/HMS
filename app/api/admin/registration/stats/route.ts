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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalPatients,
      todayRegistrations,
      monthlyRegistrations,
      opdPatients,
      ipdPatients
    ] = await Promise.all([
      db.collection('users').countDocuments({ role: 'patient' }),
      db.collection('patientRegistrations').countDocuments({
        registrationDate: { $gte: today }
      }).catch(() => 0),
      db.collection('patientRegistrations').countDocuments({
        registrationDate: { $gte: startOfMonth }
      }).catch(() => 0),
      db.collection('patientRegistrations').countDocuments({ patientType: 'OPD' }).catch(() => 0),
      db.collection('patientRegistrations').countDocuments({ patientType: 'IPD' }).catch(() => 0)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        todayRegistrations,
        monthlyRegistrations,
        opdPatients,
        ipdPatients
      }
    });
  } catch (error) {
    console.error('Registration stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registration stats' },
      { status: 500 }
    );
  }
}