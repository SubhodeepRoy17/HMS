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
    const patientId = url.searchParams.get('patientId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter - only show prescriptions from this doctor
    const filter: any = { doctorId: new ObjectId(user.userId) };
    
    if (patientId) {
      filter.patientId = patientId;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get total count for pagination
    const total = await db.collection('prescriptions').countDocuments(filter);

    // Get paginated prescriptions
    const prescriptions = await db
      .collection('prescriptions')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      message: 'Prescriptions retrieved',
      data: prescriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch prescriptions' },
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
    const { appointmentId, patientId, medication, dosage, frequency, duration, instructions, status } = body;

    // Validate required fields
    if (!appointmentId || !patientId || !medication || !dosage || !frequency) {
      return NextResponse.json(
        { success: false, message: 'appointmentId, patientId, medication, dosage and frequency are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(appointmentId),
      doctorId: new ObjectId(user.userId),
      patientId,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Prescription can only be created for your own consultation appointment' },
        { status: 403 }
      );
    }

    // Verify patient exists from registration and derive display name
    const patient = await db.collection('patientRegistrations').findOne(
      { patientId },
      { sort: { registrationDate: -1 } }
    );

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    const patientName = patient.demographics?.fullName || `${patient.demographics?.firstName || ''} ${patient.demographics?.lastName || ''}`.trim();

    // Create prescription
    const result = await db.collection('prescriptions').insertOne({
      doctorId: new ObjectId(user.userId),
      appointmentId: new ObjectId(appointmentId),
      patientId,
      patientName,
      medication,
      dosage,
      frequency,
      duration: duration || 'AS NEEDED',
      instructions: instructions || '',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const prescription = await db.collection('prescriptions').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
    }, { status: 201 });

  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
