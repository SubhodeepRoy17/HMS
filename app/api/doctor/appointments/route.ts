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
    
    // Get query params for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const patientId = url.searchParams.get('patientId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter - only show appointments for this doctor
    const filter: any = { doctorId: new ObjectId(user.userId) };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (patientId) {
      filter.patientId = patientId;
    }

    // Get total count for pagination
    const total = await db.collection('appointments').countDocuments(filter);

    // Get paginated appointments
    const appointments = await db
      .collection('appointments')
      .find(filter)
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      message: 'Appointments retrieved',
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
    // Verify authentication
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { patientId, appointmentDate, reason, notes, status } = body;

    // Validate required fields
    if (!patientId || !appointmentDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify patient exists
    const patient = await db.collection('users').findOne({ 
      _id: new ObjectId(patientId),
      role: 'patient'
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create appointment
    const result = await db.collection('appointments').insertOne({
      doctorId: new ObjectId(user.userId),
      patientId: new ObjectId(patientId),
      appointmentDate: new Date(appointmentDate),
      reason,
      notes: notes || '',
      status: status || 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const appointment = await db.collection('appointments').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
    }, { status: 201 });

  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
