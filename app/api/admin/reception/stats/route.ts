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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      totalDoctors,
      totalReceptionists
    ] = await Promise.all([
      db.collection('appointments').countDocuments().catch(() => 0),
      db.collection('appointments').countDocuments({
        appointmentDate: { $gte: today, $lt: tomorrow }
      }).catch(() => 0),
      db.collection('appointments').countDocuments({ status: 'completed' }).catch(() => 0),
      db.collection('appointments').countDocuments({ status: 'cancelled' }).catch(() => 0),
      db.collection('users').countDocuments({ role: 'doctor' }),
      db.collection('users').countDocuments({ role: 'receptionist' })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        completedAppointments,
        cancelledAppointments,
        totalDoctors,
        totalReceptionists
      }
    });
  } catch (error) {
    console.error('Reception stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reception stats' },
      { status: 500 }
    );
  }
}