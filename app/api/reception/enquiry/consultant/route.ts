import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
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
    const specialization = url.searchParams.get('specialization');
    const date = url.searchParams.get('date');

    let filter: any = { role: 'doctor', isActive: true };

    if (doctorId) {
      filter._id = doctorId;
    }
    if (department) {
      filter.department = department;
    }
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await db
      .collection('users')
      .find(filter)
      .project({ password: 0 })
      .toArray();

    if (doctors.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No doctors found',
      });
    }

    // Get schedules for each doctor
    const doctorsWithSchedules = await Promise.all(
      doctors.map(async (doctor) => {
        let schedules = [];
        
        if (date) {
          // Get schedule for specific date - use date range for consistency
          const targetDate = new Date(date);
          targetDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(targetDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          schedules = await db
            .collection('doctorSchedules')
            .find({ 
              doctorId: doctor._id,  // ✅ ObjectId from users collection
              date: { $gte: targetDate, $lt: nextDay }
            })
            .toArray();
        } else {
          // Get upcoming schedules for next 7 days
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 7);
          endDate.setHours(23, 59, 59, 999);
          
          schedules = await db
            .collection('doctorSchedules')
            .find({ 
              doctorId: doctor._id,  // ✅ ObjectId from users collection
              date: { $gte: startDate, $lte: endDate }
            })
            .sort({ date: 1 })
            .toArray();
        }

        // Calculate available time slots
        const availableSlots = [];
        for (const schedule of schedules) {
          for (const slot of schedule.timeSlots) {
            if (slot.isAvailable) {
              availableSlots.push({
                date: schedule.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
              });
            }
          }
        }

        return {
          ...doctor,
          schedules,
          availableSlots: availableSlots.slice(0, 10), // Limit to 10 slots
          nextAvailableSlot: availableSlots[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: doctorsWithSchedules,
    });

  } catch (error) {
    console.error('Consultant enquiry error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch consultant information' },
      { status: 500 }
    );
  }
}