import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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
    // Verify authentication
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    // Get doctor's info
    const doctor = await db.collection('users').findOne({ 
      _id: new ObjectId(user.userId),
      role: 'doctor'
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    const doctorId = new ObjectId(user.userId);

    // Get appointment statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await db.collection('appointments').countDocuments({
      doctorId,
      appointmentDate: { $gte: today, $lt: tomorrow },
    });

    const upcomingAppointments = await db.collection('appointments').countDocuments({
      doctorId,
      appointmentDate: { $gte: tomorrow },
      status: 'scheduled',
    });

    const completedAppointments = await db.collection('appointments').countDocuments({
      doctorId,
      status: 'completed',
    });

    // Get patient count
    const uniquePatients = await db.collection('appointments').distinct('patientId', { doctorId });
    const totalPatients = uniquePatients.length;

    // Get prescription count
    const activePrescriptions = await db.collection('prescriptions').countDocuments({
      doctorId,
      status: 'active',
    });

    // Get recent activity
    const recentAppointments = await db.collection('appointments')
      .find({ doctorId })
      .sort({ appointmentDate: -1 })
      .limit(5)
      .toArray();

    // Get recent prescriptions
    const recentPrescriptions = await db.collection('prescriptions')
      .find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        doctor: {
          name: `${doctor.firstName} ${doctor.lastName}`,
          department: doctor.department,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
        },
        statistics: {
          todayAppointments,
          upcomingAppointments,
          completedAppointments,
          totalPatients,
          activePrescriptions,
        },
        recentAppointments,
        recentPrescriptions,
      },
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
