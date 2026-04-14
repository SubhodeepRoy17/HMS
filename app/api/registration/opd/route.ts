import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getNextSequence, generateId, toObjectId } from '@/lib/db';
import { verifyToken, generateTempPassword, hashPassword } from '@/lib/auth';

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
    if (!user || user.role !== 'receptionist') {
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
      collectConsultationCharge = false,
      consultationCharge = 0,
      paymentMethod = 'Cash',
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !age || !sex || !phone || !email || !department || !consultantId) {
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
    let userId = null;
    let credentials: { email: string; password: string } | null = null;

    if (existingPatient) {
      finalPatientId = existingPatient.patientId;
      userId = existingPatient.userId || null;
    } else {
      const loginEmail = email.toLowerCase();
      const existingUser = await db.collection('users').findOne({
        $or: [
          { email: loginEmail },
          { phone }
        ]
      });

      if (existingUser) {
        userId = existingUser._id;
      } else {
        const tempPassword = generateTempPassword(firstName, lastName);
        const passwordHash = await hashPassword(tempPassword);
        const createdUser = await db.collection('users').insertOne({
          firstName,
          lastName,
          email: loginEmail,
          password: passwordHash,
          phone,
          role: 'patient',
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        userId = createdUser.insertedId;
        credentials = {
          email: loginEmail,
          password: tempPassword,
        };
      }
    }

    // Create OPD registration
    const registration = {
      patientId: finalPatientId,
      registrationNumber,
      userId,
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

    let consultationBill: any = null;
    let consultationReceipt: any = null;

    if (collectConsultationCharge && Number(consultationCharge) > 0) {
      const billSeq = await getNextSequence(db, 'billNumber');
      const billNumber = generateId('BILL', billSeq);
      const amount = Number(consultationCharge);

      const billDoc = {
        billNumber,
        billType: 'consultation',
        patientId: finalPatientId,
        patientName: `${firstName} ${lastName}`,
        registrationId: result.insertedId,
        patientType: 'General',
        paymentType: paymentMethod,
        timeSlot: 'Morning',
        doctorType: 'General',
        services: [
          {
            id: `CONS-${Date.now()}`,
            description: 'OPD Registration Consultation',
            category: 'consultation',
            quantity: 1,
            rate: amount,
            total: amount,
          },
        ],
        subTotal: amount,
        tax: 0,
        concession: { percentage: 0, amount: 0, authority: '' },
        totalAmount: amount,
        amountPaid: amount,
        balanceDue: 0,
        status: 'paid',
        createdBy: toObjectId(user.userId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const billInsert = await db.collection('bills').insertOne(billDoc);
      consultationBill = await db.collection('bills').findOne({ _id: billInsert.insertedId });

      const receiptSeq = await getNextSequence(db, 'receiptNumber');
      const receiptNumber = generateId('RCT', receiptSeq);

      const receiptDoc = {
        receiptNumber,
        billId: billInsert.insertedId,
        patientId: finalPatientId,
        patientName: `${firstName} ${lastName}`,
        amount,
        paymentMethod,
        transactionId: null,
        paymentDate: new Date(),
        printedDate: new Date(),
        printedBy: toObjectId(user.userId),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const receiptInsert = await db.collection('receipts').insertOne(receiptDoc);
      consultationReceipt = await db.collection('receipts').findOne({ _id: receiptInsert.insertedId });
    }

    const newRegistration = await db.collection('patientRegistrations').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'OPD patient registered successfully',
      credentials,
      data: {
        registration: newRegistration,
        opdCard,
        consultationBill,
        consultationReceipt,
        credentials,
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