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
      firstName, lastName, age, sex, dateOfBirth,
      address, city, state, pincode, phone, email,
      nationality, emergencyContact,
      department, consultantId, consultantName,
      referringSource, sponsorship, panelDetails,
      roomNumber, bedNumber, admittingDoctorId,
      expectedDischargeDate, treatmentRequired
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !age || !sex || !phone || !department || !consultantId || !roomNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields. Room number is mandatory for IPD' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check room availability
    const room = await db.collection('rooms').findOne({ roomNumber });
    if (!room || room.availableBeds <= 0) {
      return NextResponse.json(
        { success: false, message: 'Selected room has no available beds' },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const patientIdSeq = await getNextSequence(db, 'patientId');
    const patientId = generateId('PAT', patientIdSeq);
    
    const registrationSeq = await getNextSequence(db, 'registrationNumber');
    const registrationNumber = generateId('REG', registrationSeq);

    // Check if patient already exists
    let existingPatient = await db.collection('patientRegistrations').findOne({
      'demographics.phone': phone
    });

    let finalPatientId = patientId;
    if (existingPatient) {
      finalPatientId = existingPatient.patientId;
    }

    // Create IPD registration
    const registration = {
      patientId: finalPatientId,
      registrationNumber,
      patientType: 'IPD',
      demographics: {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        age,
        sex,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        pincode,
        phone,
        email: email || '',
        nationality: nationality || 'Indian',
        emergencyContact: emergencyContact || null,
      },
      department,
      consultantId: toObjectId(consultantId),
      consultantName,
      referringSource: referringSource || 'Self',
      sponsorship: sponsorship || 'Cash',
      panelDetails: panelDetails || '',
      roomNumber,
      bedNumber: bedNumber || '1',
      admissionDate: new Date(),
      expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
      admittingDoctorId: admittingDoctorId ? toObjectId(admittingDoctorId) : toObjectId(consultantId),
      treatmentRequired: treatmentRequired || '',
      paymentStatus: 'pending',
      status: 'active',
      registrationDate: new Date(),
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('patientRegistrations').insertOne(registration);

    // Update room availability
    await db.collection('rooms').updateOne(
      { roomNumber },
      { $inc: { availableBeds: -1 } }
    );

    // Create bed allocation record
    const bedAllocation = {
      patientId: finalPatientId,
      patientName: `${firstName} ${lastName}`,
      registrationId: result.insertedId,
      roomId: room._id,
      roomNumber,
      bedNumber: bedNumber || '1',
      allocatedDate: new Date(),
      expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
      status: 'occupied',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('bedAllocations').insertOne(bedAllocation);

    const newRegistration = await db.collection('patientRegistrations').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'IPD patient admitted successfully',
      data: {
        registration: newRegistration,
        bedAllocation,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('IPD registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to admit IPD patient' },
      { status: 500 }
    );
  }
}