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
      filter.doctorId = toObjectId(doctorId);  // ✅ Convert to ObjectId for consistent queries
    }
    if (department) {
      filter.department = department;
    }
    
    // Handle date range query
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(year, month - 1, day);
      endDate.setHours(23, 59, 59, 999);
      
      filter.date = { $gte: startDate, $lte: endDate };
    }

    console.log('Schedule GET filter:', JSON.stringify(filter, null, 2));

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
    const { doctorId, doctorName, department, doctorType, date, timeSlots } = body;

    console.log('Schedule POST body:', { doctorId, doctorName, department, doctorType, date, timeSlots });

    if (!doctorId || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: doctorId, date, timeSlots' },
        { status: 400 }
      );
    }

    if (timeSlots.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one time slot is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Parse date properly - date comes as YYYY-MM-DD string
    const [year, month, day] = date.split('-').map(Number);
    const scheduleDate = new Date(year, month - 1, day);
    scheduleDate.setHours(0, 0, 0, 0);

    console.log('Parsed schedule date:', scheduleDate);

    // Check if schedule already exists for this doctor on this date
    const dateEnd = new Date(scheduleDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existingSchedule = await db.collection('doctorSchedules').findOne({
      doctorId: toObjectId(doctorId),  // ✅ Convert to ObjectId (docs use _id field)
      date: { $gte: scheduleDate, $lte: dateEnd }
    });

    console.log('Existing schedule:', existingSchedule);

    if (existingSchedule) {
      // Update existing schedule
      console.log('Updating existing schedule:', existingSchedule._id);
      
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
            doctorType: doctorType || 'General',
            department,
            updatedAt: new Date()
          }
        }
      );
      
      const updatedSchedule = await db.collection('doctorSchedules').findOne({ _id: existingSchedule._id });
      console.log('Updated schedule:', updatedSchedule);
      
      return NextResponse.json({
        success: true,
        message: 'Doctor schedule updated successfully',
        data: updatedSchedule,
      }, { status: 200 });
    }

    const schedule = {
      doctorId: toObjectId(doctorId),  // ✅ Store as ObjectId (matches database _id field)
      doctorName,
      department,
      doctorType: doctorType || 'General',
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

    console.log('Creating new schedule:', schedule);

    const result = await db.collection('doctorSchedules').insertOne(schedule);
    const newSchedule = await db.collection('doctorSchedules').findOne({ _id: result.insertedId });

    console.log('New schedule created:', newSchedule);

    return NextResponse.json({
      success: true,
      message: 'Doctor schedule created successfully',
      data: newSchedule,
    }, { status: 201 });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create schedule: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}