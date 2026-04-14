import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId } from '@/lib/db';
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const { id: appointmentId } = await params;

    const appointment = await db.collection('appointments').findOne({ appointmentId });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Free up the time slot in doctor's schedule
    await db.collection('doctorSchedules').updateOne(
      {
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
        'timeSlots.appointmentId': appointmentId,
      },
      {
        $set: {
          'timeSlots.$.isAvailable': true,
          'timeSlots.$.patientId': null,
          'timeSlots.$.appointmentId': null,
        },
      }
    );

    // Delete or mark as cancelled
    const result = await db.collection('appointments').updateOne(
      { appointmentId },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newDate, newTimeSlot } = body;
    const { id: appointmentId } = await params;

    if (!newDate || !newTimeSlot) {
      return NextResponse.json(
        { success: false, message: 'New date and time slot required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const appointment = await db.collection('appointments').findOne({ appointmentId });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if new time slot is available
    const scheduleDate = new Date(newDate);
    const schedule = await db.collection('doctorSchedules').findOne({
      doctorId: appointment.doctorId,
      date: scheduleDate,
      'timeSlots.startTime': newTimeSlot,
      'timeSlots.isAvailable': true,
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: 'Selected time slot is not available' },
        { status: 400 }
      );
    }

    // Free up old time slot
    await db.collection('doctorSchedules').updateOne(
      {
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
        'timeSlots.appointmentId': appointmentId,
      },
      {
        $set: {
          'timeSlots.$.isAvailable': true,
          'timeSlots.$.patientId': null,
          'timeSlots.$.appointmentId': null,
        },
      }
    );

    // Book new time slot
    await db.collection('doctorSchedules').updateOne(
      {
        doctorId: appointment.doctorId,
        date: scheduleDate,
        'timeSlots.startTime': newTimeSlot,
      },
      {
        $set: {
          'timeSlots.$.isAvailable': false,
          'timeSlots.$.patientId': appointment.patientId,
          'timeSlots.$.appointmentId': appointmentId,
        },
      }
    );

    // Update appointment
    const result = await db.collection('appointments').updateOne(
      { appointmentId },
      {
        $set: {
          appointmentDate: new Date(newDate),
          timeSlot: newTimeSlot,
          updatedAt: new Date(),
        },
      }
    );

    const updatedAppointment = await db.collection('appointments').findOne({ appointmentId });

    return NextResponse.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment,
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}