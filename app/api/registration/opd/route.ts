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
      consultationCharges
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !age || !sex || !phone || !department || !consultantId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Generate unique IDs
    const patientIdSeq = await getNextSequence(db, 'patientId');
    const patientId = generateId('PAT', patientIdSeq);
    
    const registrationSeq = await getNextSequence(db, 'registrationNumber');
    const registrationNumber = generateId('REG', registrationSeq);

    // Check if patient already exists by phone
    let existingPatient = await db.collection('patientRegistrations').findOne({
      'demographics.phone': phone
    });

    let finalPatientId = patientId;
    if (existingPatient) {
      finalPatientId = existingPatient.patientId;
    }

    // Create OPD registration
    const registration = {
      patientId: finalPatientId,
      registrationNumber,
      patientType: 'OPD',
      demographics: {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        age,
        sex,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
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
      consultationCharges: consultationCharges || 0,
      paymentStatus: 'pending',
      status: 'active',
      registrationDate: new Date(),
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('patientRegistrations').insertOne(registration);

    // Generate OPD card
    const cardSeq = await getNextSequence(db, 'opdCardNumber');
    const cardNumber = generateId('OPD', cardSeq);
    
    const opdCard = {
      registrationId: result.insertedId,
      patientId: finalPatientId,
      patientName: `${firstName} ${lastName}`,
      cardNumber,
      issuedDate: new Date(),
      isValid: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('opdCards').insertOne(opdCard);

    const newRegistration = await db.collection('patientRegistrations').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'OPD patient registered successfully',
      data: {
        registration: newRegistration,
        opdCard,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('OPD registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register OPD patient' },
      { status: 500 }
    );
  }
}