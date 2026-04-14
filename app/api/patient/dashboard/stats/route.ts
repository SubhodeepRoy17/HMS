import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return verifyToken(parts[1]);
}

export async function GET(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    let patientId = user.patientId || null;
    if (!patientId) {
      const patientRegistration = await db.collection('patientRegistrations').findOne(
        { userId: toObjectId(user.userId) },
        { sort: { registrationDate: -1 } }
      );
      patientId = patientRegistration?.patientId || null;
    }

    if (!patientId) {
      return NextResponse.json({
        success: true,
        data: {
          upcomingAppointments: 0,
          completedAppointments: 0,
          activePrescriptions: 0,
          completedTests: 0,
          pendingTests: 0,
        },
      });
    }

    const now = new Date();

    const [upcomingAppointments, completedAppointments, activePrescriptions, completedTests, pendingTests] = await Promise.all([
      db.collection('appointments').countDocuments({ patientId, status: 'scheduled', appointmentDate: { $gte: now } }),
      db.collection('appointments').countDocuments({ patientId, status: 'completed' }),
      db.collection('prescriptions').countDocuments({ patientId, status: 'active' }),
      db.collection('investigations').countDocuments({ patientId, status: { $in: ['completed', 'verified'] } }),
      db.collection('investigations').countDocuments({ patientId, status: { $in: ['pending', 'in-progress', 'entered'] } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        upcomingAppointments,
        completedAppointments,
        activePrescriptions,
        completedTests,
        pendingTests,
      },
    });
  } catch (error) {
    console.error('Patient dashboard stats error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
