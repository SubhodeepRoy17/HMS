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
    
    // Get query params for filtering and search
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const recordType = url.searchParams.get('recordType');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter - only show records for this doctor's patients
    const filter: any = { doctorId: new ObjectId(user.userId) };
    
    if (patientId) {
      filter.patientId = patientId;
    }
    
    if (recordType && recordType !== 'all') {
      filter.recordType = recordType;
    }

    // Add search to multiple fields
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { recordType: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count for pagination
    const total = await db.collection('medicalRecords').countDocuments(filter);

    // Get paginated records
    const records = await db
      .collection('medicalRecords')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      message: 'Medical records retrieved',
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch medical records' },
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
    const { patientId, recordType, description, findings, status } = body;

    // Validate required fields
    if (!patientId || !recordType || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

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

    // Create medical record
    const result = await db.collection('medicalRecords').insertOne({
      doctorId: new ObjectId(user.userId),
      patientId,
      patientName,
      recordType,
      description,
      findings: findings || '',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const record = await db.collection('medicalRecords').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Medical record created successfully',
      data: record,
    }, { status: 201 });

  } catch (error) {
    console.error('Create medical record error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create medical record' },
      { status: 500 }
    );
  }
}
