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
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all counts in parallel
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalReceptionists,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      totalRevenue,
      pendingBills,
      newUsersThisMonth,
      activePrescriptions,
      todayAppointments
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ role: 'doctor' }),
      db.collection('users').countDocuments({ role: 'patient' }),
      db.collection('users').countDocuments({ role: 'receptionist' }),
      db.collection('appointments').countDocuments().catch(() => 0),
      db.collection('appointments').countDocuments({ status: 'scheduled' }).catch(() => 0),
      db.collection('appointments').countDocuments({ status: 'completed' }).catch(() => 0),
      db.collection('bills').aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray().then(result => result[0]?.total || 0).catch(() => 0),
      db.collection('bills').countDocuments({ status: 'pending' }).catch(() => 0),
      db.collection('users').countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      db.collection('prescriptions').countDocuments({ status: 'active' }).catch(() => 0),
      db.collection('appointments').countDocuments({ 
        appointmentDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      }).catch(() => 0)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalReceptionists,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        totalRevenue,
        pendingBills,
        newUsersThisMonth,
        activePrescriptions,
        todayAppointments
      },
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}