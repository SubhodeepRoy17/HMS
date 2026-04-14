import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getNextSequence, generateId, toObjectId } from '@/lib/db';
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const doctorId = url.searchParams.get('doctorId');
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let filter: any = {};

    // FIXED: patientId is a STRING (e.g., "PAT0001"), not ObjectId
    if (patientId) {
      filter.patientId = patientId;  // ✅ Keep as string, don't convert
    }
    if (doctorId) {
      filter.doctorId = toObjectId(doctorId);
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startDate, $lte: endDate };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Role-based filtering - FIXED for patient role
    if (user.role === 'doctor') {
      filter.doctorId = toObjectId(user.userId);
    } else if (user.role === 'patient') {
      // Patient needs to get their patientId from the token or user record
      // First check if token has patientId
      if (user.patientId) {
        filter.patientId = user.patientId;  // ✅ Use string patientId
      } else {
        // Fallback: Look up patientId from database
        const patientRecord = await db.collection('patientRegistrations').findOne(
          { userId: toObjectId(user.userId) },
          { sort: { registrationDate: -1 } }
        );
        if (patientRecord) {
          filter.patientId = patientRecord.patientId;
        } else {
          // If no patient record, return empty
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, pages: 0 },
          });
        }
      }
    }

    const total = await db.collection('appointments').countDocuments(filter);
    const appointments = await db
      .collection('appointments')
      .find(filter)
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      patientId, patientName, patientPhone,
      doctorId, doctorName, department,
      appointmentDate, timeSlot, reason, notes
    } = body;

    if (!patientId || !doctorId || !appointmentDate || !timeSlot || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // FIXED: Create date range for the entire day
    const scheduleDate = new Date(appointmentDate);
    scheduleDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(scheduleDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if time slot is available
    const schedule = await db.collection('doctorSchedules').findOne({
      doctorId: toObjectId(doctorId),  // ✅ Query as ObjectId (consistent storage)
      date: { $gte: scheduleDate, $lt: nextDay },
      'timeSlots.startTime': timeSlot,
      'timeSlots.isAvailable': true,
    });

    if (!schedule) {
      console.log('Schedule not found for:', { doctorId: toObjectId(doctorId), timeSlot, date: scheduleDate });
      return NextResponse.json(
        { success: false, message: 'Selected time slot is not available' },
        { status: 400 }
      );
    }

    // Generate appointment ID
    const appointmentSeq = await getNextSequence(db, 'appointmentId');
    const appointmentId = generateId('APT', appointmentSeq);

    // Store appointment
    const appointment = {
      appointmentId,
      patientId: patientId,
      patientName,
      patientPhone,
      doctorId: toObjectId(doctorId),
      doctorName,
      department,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      reason,
      notes: notes || '',
      status: 'scheduled',
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('appointments').insertOne(appointment);

    // Update schedule to mark time slot as booked
    await db.collection('doctorSchedules').updateOne(
      {
        doctorId: toObjectId(doctorId),  // ✅ Query as ObjectId (consistent storage)
        date: { $gte: scheduleDate, $lt: nextDay },
        'timeSlots.startTime': timeSlot,
      },
      {
        $set: {
          'timeSlots.$.isAvailable': false,
          'timeSlots.$.patientId': patientId,
          'timeSlots.$.appointmentId': appointmentId,
          updatedAt: new Date(),
        },
      }
    );

    const newAppointment = await db.collection('appointments').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: newAppointment,
    }, { status: 201 });

  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { appointmentId, status, notes } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: 'Appointment ID required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;

    const result = await db.collection('appointments').updateOne(
      { appointmentId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If appointment is cancelled, free up the time slot
    if (status === 'cancelled') {
      const appointment = await db.collection('appointments').findOne({ appointmentId });
      if (appointment) {
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
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    const updatedAppointment = await db.collection('appointments').findOne({ appointmentId });

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment,
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}