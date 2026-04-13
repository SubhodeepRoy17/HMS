import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// Helper function to get next appointment ID (avoids TypeScript issues)
async function getNextAppointmentId(db: any): Promise<string> {
  try {
    // Simple approach: find current counter and increment
    const counter = await db.collection('counters').findOne({ _id: 'appointmentId' });
    
    let nextSeq = 1;
    if (counter && typeof counter.seq === 'number') {
      nextSeq = counter.seq + 1;
    }
    
    // Update the counter
    await db.collection('counters').updateOne(
      { _id: 'appointmentId' },
      { $set: { seq: nextSeq } },
      { upsert: true }
    );
    
    return `APT${String(nextSeq).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating appointment ID:', error);
    // Fallback: use timestamp
    return `APT${Date.now()}`;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Extract and verify token
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // For patients, we need patientId from token
    if (payload.role === 'patient') {
      if (!payload.patientId) {
        return NextResponse.json(
          { success: false, message: 'Patient ID not found in token' },
          { status: 400 }
        );
      }
      
      const { db } = await connectToDatabase();
      
      // Get query parameters for filtering
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      
      // Build filter
      let filter: any = { patientId: payload.patientId };
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      // Fetch appointments for this patient only
      const appointments = await db.collection('appointments')
        .find(filter)
        .sort({ appointmentDate: -1 })
        .toArray();
      
      return NextResponse.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    }
    
    // For other roles (admin, doctor, receptionist) - they can see all with filters
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const doctorId = url.searchParams.get('doctorId');
    const status = url.searchParams.get('status');
    
    let filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = new ObjectId(doctorId);
    if (status && status !== 'all') filter.status = status;
    
    const appointments = await db.collection('appointments')
      .find(filter)
      .sort({ appointmentDate: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
    
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { doctorId, appointmentDate, timeSlot, reason, notes } = body;

    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get patient info
    let patientId = payload.patientId;
    let patientInfo = null;
    
    if (payload.role === 'patient') {
      if (!patientId) {
        return NextResponse.json(
          { success: false, message: 'Patient ID not found' },
          { status: 400 }
        );
      }
      
      patientInfo = await db.collection('patientRegistrations').findOne(
        { patientId: patientId },
        { sort: { registrationDate: -1 } }
      );
    } else {
      // If admin/receptionist booking for patient
      const { patientId: reqPatientId } = body;
      if (!reqPatientId) {
        return NextResponse.json(
          { success: false, message: 'Patient ID required' },
          { status: 400 }
        );
      }
      patientId = reqPatientId;
      patientInfo = await db.collection('patientRegistrations').findOne(
        { patientId: patientId },
        { sort: { registrationDate: -1 } }
      );
    }

    if (!patientInfo) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get doctor info
    const doctor = await db.collection('users').findOne({ 
      _id: new ObjectId(doctorId),
      role: 'doctor'
    });
    
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Generate appointment ID - FIXED: using helper function
    const appointmentId = await getNextAppointmentId(db);

    // Create appointment
    const appointment = {
      appointmentId,
      patientId: patientInfo.patientId,
      patientRegistrationId: patientInfo._id,
      patientName: `${patientInfo.demographics.firstName} ${patientInfo.demographics.lastName}`,
      patientPhone: patientInfo.demographics.phone,
      doctorId: new ObjectId(doctorId),
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      department: doctor.department || patientInfo.department,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      reason,
      notes: notes || '',
      status: 'scheduled',
      createdBy: new ObjectId(payload.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('appointments').insertOne(appointment);
    
    // Update doctor schedule slot to unavailable (if schedule exists)
    try {
      await db.collection('doctorSchedules').updateOne(
        { 
          doctorId: new ObjectId(doctorId),
          date: new Date(appointmentDate),
          'timeSlots.startTime': timeSlot
        },
        { 
          $set: { 
            'timeSlots.$.isAvailable': false,
            'timeSlots.$.patientId': patientInfo.patientId,
            'timeSlots.$.appointmentId': appointmentId
          }
        }
      );
    } catch (scheduleError) {
      // Schedule might not exist - that's fine
      console.log('No schedule found for this time slot, skipping update');
    }

    const newAppointment = await db.collection('appointments').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment,
    }, { status: 201 });

  } catch (error) {
    console.error('Book appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('id');
    
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: 'Appointment ID required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find the appointment first
    const appointment = await db.collection('appointments').findOne({ 
      appointmentId: appointmentId  // FIXED: search by appointmentId string, not ObjectId
    });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Verify patient owns this appointment
    if (payload.role === 'patient' && appointment.patientId !== payload.patientId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Not your appointment' },
        { status: 403 }
      );
    }
    
    // Update status to cancelled instead of deleting
    await db.collection('appointments').updateOne(
      { appointmentId: appointmentId },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );
    
    // Free up the doctor's schedule slot (if schedule exists)
    try {
      await db.collection('doctorSchedules').updateOne(
        { 
          doctorId: appointment.doctorId,
          date: appointment.appointmentDate,
          'timeSlots.startTime': appointment.timeSlot
        },
        { 
          $set: { 
            'timeSlots.$.isAvailable': true,
            'timeSlots.$.patientId': null,
            'timeSlots.$.appointmentId': null
          }
        }
      );
    } catch (scheduleError) {
      console.log('No schedule found, skipping slot update');
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