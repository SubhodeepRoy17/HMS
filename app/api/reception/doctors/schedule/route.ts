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
    const doctorId = url.searchParams.get('doctorId');
    const department = url.searchParams.get('department');
    const date = url.searchParams.get('date');

    let filter: any = {};
    
    if (doctorId) {
      filter.doctorId = toObjectId(doctorId);
    }
    if (department) {
      filter.department = department;
    }
    
    // FIXED: Date range query instead of exact match
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.date = { $gte: startDate, $lte: endDate };
    }

    console.log('Schedule filter:', JSON.stringify(filter, null, 2));

    const schedules = await db
      .collection('doctorSchedules')
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    console.log(`Found ${schedules.length} schedules`);

    return NextResponse.json({
      success: true,
      data: schedules,
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch schedules' },
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
    const { doctorId, doctorName, department, date, timeSlots } = body;

    if (!doctorId || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Parse date properly - set to start of day
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    // Check if schedule already exists for this doctor on this date
    const existingSchedule = await db.collection('doctorSchedules').findOne({
      doctorId: toObjectId(doctorId),
      date: { $gte: scheduleDate, $lt: new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existingSchedule) {
      // Instead of error, let's update existing schedule
      await db.collection('doctorSchedules').updateOne(
        { _id: existingSchedule._id },
        { 
          $set: {
            timeSlots: timeSlots.map((slot: any) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true,
              patientId: null,
              appointmentId: null,
            })),
            updatedAt: new Date()
          }
        }
      );
      
      const updatedSchedule = await db.collection('doctorSchedules').findOne({ _id: existingSchedule._id });
      
      return NextResponse.json({
        success: true,
        message: 'Doctor schedule updated successfully',
        data: updatedSchedule,
      }, { status: 200 });
    }

    const schedule = {
      doctorId: toObjectId(doctorId),
      doctorName,
      department,
      date: scheduleDate,
      timeSlots: timeSlots.map((slot: any) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true,
        patientId: null,
        appointmentId: null,
      })),
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('doctorSchedules').insertOne(schedule);
    const newSchedule = await db.collection('doctorSchedules').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Doctor schedule created successfully',
      data: newSchedule,
    }, { status: 201 });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}