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

    // Get recent user registrations
    const recentRegistrations = await db
      .collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get recent appointments
    const recentAppointments = await db
      .collection('appointments')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
      .catch(() => []);

    // Build activity feed
    const activities = [];

    // Add registration activities
    for (const reg of recentRegistrations) {
      activities.push({
        _id: reg._id.toString(),
        userId: reg._id.toString(),
        userName: `${reg.firstName} ${reg.lastName}`,
        action: 'User Registered',
        type: 'registration',
        timestamp: reg.createdAt,
        description: `${reg.role} account created`,
      });
    }

    // Add appointment activities
    for (const apt of recentAppointments) {
      activities.push({
        _id: apt._id.toString(),
        userId: apt._id.toString(),
        userName: apt.patientName || 'Unknown',
        action: 'Appointment Created',
        type: 'appointment',
        timestamp: apt.createdAt || new Date(),
        description: `Appointment with ${apt.doctorName || 'Doctor'}`,
      });
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      message: 'Activity feed retrieved',
      data: activities.slice(0, 15),
    });

  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}