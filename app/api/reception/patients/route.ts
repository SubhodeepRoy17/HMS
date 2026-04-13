import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getNextSequence, generateId, toObjectId, ObjectId } from '@/lib/db';
import { verifyToken, hashPassword, generateTempPassword } from '@/lib/auth';

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
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin' && user.role !== 'doctor')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const patientId = url.searchParams.get('patientId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (patientId) {
      filter.patientId = patientId;
    }

    if (search) {
      filter.$or = [
        { 'demographics.firstName': { $regex: search, $options: 'i' } },
        { 'demographics.lastName': { $regex: search, $options: 'i' } },
        { 'demographics.phone': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await db.collection('patientRegistrations').countDocuments(filter);
    const registrations = await db
      .collection('patientRegistrations')
      .find(filter)
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get unique patients (latest registration for each patient)
    const uniquePatients = new Map();
    for (const reg of registrations) {
      if (!uniquePatients.has(reg.patientId)) {
        uniquePatients.set(reg.patientId, reg);
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(uniquePatients.values()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch patients' },
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
      firstName, lastName, age, sex, dateOfBirth,
      address, city, state, pincode, phone, email,
      nationality, emergencyContact,
      department, consultantId, consultantName,
      referringSource, sponsorship, panelDetails,
      patientType, // 'OPD' or 'IPD'
      roomNumber, bedNumber, consultationCharges
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

    // Check if patient already exists by phone or email
    let existingPatient = await db.collection('patientRegistrations').findOne({
      $or: [
        { 'demographics.phone': phone },
        { 'demographics.email': email?.toLowerCase() }
      ]
    });

    let finalPatientId = patientId;
    let userId = null;
    let patientCredentials = null;

    if (existingPatient) {
      finalPatientId = existingPatient.patientId;
      userId = existingPatient.userId;
    } else {
      // CREATE USER ACCOUNT FOR NEW PATIENT
      const userEmail = email || `${phone}@hospital.com`;
      const tempPassword = generateTempPassword(firstName, lastName);
      const hashedPassword = await hashPassword(tempPassword);
      
      // Check if user already exists
      let existingUser = await db.collection('users').findOne({ 
        $or: [
          { email: userEmail.toLowerCase() },
          { phone: phone }
        ]
      });
      
      if (!existingUser) {
        const userResult = await db.collection('users').insertOne({
          firstName,
          lastName,
          email: userEmail.toLowerCase(),
          password: hashedPassword,
          phone,
          role: 'patient',
          department: null,
          specialization: null,
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userId = userResult.insertedId;
        
        patientCredentials = {
          email: userEmail,
          password: tempPassword,
          message: "Please provide these credentials to the patient for login"
        };
        
        console.log(`Created patient user: ${userEmail} with password: ${tempPassword}`);
      } else {
        userId = existingUser._id;
      }
    }

    // Create registration record
    const registration = {
      patientId: finalPatientId,
      registrationNumber,
      userId: userId, // Link to user account
      patientType,
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
        email: email?.toLowerCase(),
        nationality: nationality || 'Indian',
        emergencyContact: emergencyContact || null,
      },
      department,
      consultantId: toObjectId(consultantId),
      consultantName,
      referringSource: referringSource || 'Self',
      sponsorship: sponsorship || 'Cash',
      panelDetails: panelDetails || '',
      roomNumber: patientType === 'IPD' ? roomNumber : undefined,
      bedNumber: patientType === 'IPD' ? bedNumber : undefined,
      admissionDate: patientType === 'IPD' ? new Date() : undefined,
      consultationCharges: consultationCharges || 0,
      paymentStatus: 'pending',
      status: 'active',
      registrationDate: new Date(),
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('patientRegistrations').insertOne(registration);

    // If OPD, generate OPD card
    if (patientType === 'OPD') {
      const cardSeq = await getNextSequence(db, 'opdCardNumber');
      const cardNumber = generateId('OPD', cardSeq);
      
      await db.collection('opdCards').insertOne({
        registrationId: result.insertedId,
        patientId: finalPatientId,
        patientName: `${firstName} ${lastName}`,
        cardNumber,
        issuedDate: new Date(),
        isValid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const newRegistration = await db.collection('patientRegistrations').findOne({ _id: result.insertedId });

    // Return response with credentials if new user was created
    const responseData: any = { ...newRegistration };
    if (patientCredentials) {
      responseData.credentials = patientCredentials;
    }

    return NextResponse.json({
      success: true,
      message: 'Patient registered successfully',
      data: responseData,
    }, { status: 201 });

  } catch (error) {
    console.error('Register patient error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register patient' },
      { status: 500 }
    );
  }
}