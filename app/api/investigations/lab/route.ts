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
    const status = url.searchParams.get('status');
    const testCategory = url.searchParams.get('testCategory');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (patientId) {
      filter.patientId = patientId;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (testCategory && testCategory !== 'all') {
      filter.testCategory = testCategory;
    }

    // Role-based filtering
    if (user.role === 'patient') {
      if (user.patientId) {
        filter.patientId = user.patientId;
      } else {
        const patientRegistration = await db.collection('patientRegistrations').findOne(
          { userId: toObjectId(user.userId) },
          { sort: { registrationDate: -1 } }
        );

        if (!patientRegistration?.patientId) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          });
        }

        filter.patientId = patientRegistration.patientId;
      }
    }

    const total = await db.collection('investigations').countDocuments(filter);
    const investigations = await db
      .collection('investigations')
      .find(filter)
      .sort({ requisitionDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: investigations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get investigations error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch investigations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'doctor' && user.role !== 'admin' && user.role !== 'receptionist')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only authorized clinical users can order tests' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      patientId,
      patientName,
      patientAge,
      patientGender,
      registrationId,
      testName,
      testCategory,
      department,
      clinicalNotes,
    } = body;

    if (!patientId || !testName || !testCategory) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Generate investigation ID
    const invSeq = await getNextSequence(db, 'investigationId');
    const investigationId = generateId('INV', invSeq);

    // Get test parameters from test master
    const testMaster = await db.collection('testMasters').findOne({ testName });
    
    let parameters = [];
    if (testMaster) {
      parameters = testMaster.parameters.map((param: any) => ({
        name: param.name,
        value: '',
        unit: param.unit,
        referenceRange: param.referenceRange,
        isAbnormal: false,
        interpretation: null,
        formula: param.formula || null,
        options: param.options || null,
      }));
    }

    const investigation = {
      investigationId,
      patientId,
      patientName,
      patientAge: patientAge || 0,
      patientGender: patientGender || 'Other',
      registrationId: registrationId ? toObjectId(registrationId) : null,
      testName,
      testCategory,
      department: department || 'Pathology',
      requisitionDate: new Date(),
      requisitionedBy: toObjectId(user.userId),
      clinicalNotes: clinicalNotes || '',
      parameters,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('investigations').insertOne(investigation);
    const newInvestigation = await db.collection('investigations').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Investigation ordered successfully',
      data: newInvestigation,
    }, { status: 201 });

  } catch (error) {
    console.error('Create investigation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create investigation' },
      { status: 500 }
    );
  }
}