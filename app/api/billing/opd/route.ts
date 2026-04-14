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

// Get pricing based on patient category and time
function getPricing(patientType: string, serviceType: string, timeSlot: string, doctorType: string): number {
  const baseRates: Record<string, Record<string, number>> = {
    'General': { consultation: 200, pathology: 300, imaging: 500, procedure: 800, medicine: 100 },
    'VIP': { consultation: 400, pathology: 600, imaging: 1000, procedure: 1600, medicine: 200 },
    'Insurance': { consultation: 180, pathology: 250, imaging: 400, procedure: 700, medicine: 90 },
    'Panel': { consultation: 150, pathology: 200, imaging: 350, procedure: 600, medicine: 80 },
  };

  const timeMultipliers: Record<string, number> = { 'Morning': 1, 'Evening': 1.2, 'Night': 1.5 };
  const emergencyMultiplier = doctorType === 'Emergency' ? 1.5 : 1;

  const baseRate = baseRates[patientType]?.[serviceType] || 100;
  return baseRate * timeMultipliers[timeSlot] * emergencyMultiplier;
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
    const billType = url.searchParams.get('billType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
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
    if (billType && billType !== 'all') {
      filter.billType = billType;
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
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

    const total = await db.collection('bills').countDocuments(filter);
    const bills = await db
      .collection('bills')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get bills error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin' && user.role !== 'doctor')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      patientId,
      patientName,
      registrationId,
      patientType = 'General',
      paymentType = 'Cash',
      timeSlot = 'Morning',
      doctorType = 'General',
      billType,
      services,
      concessionPercentage = 0,
      concessionAmount = 0,
      concessionAuthority = '',
    } = body;

    if (!patientId || !services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Patient ID and services are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get patient details if registration ID provided
    let patientDetails = null;
    if (registrationId) {
      patientDetails = await db.collection('patientRegistrations').findOne({ _id: toObjectId(registrationId) });
    }

    // Calculate service charges with dynamic pricing
    const serviceItems = services.map((service: any) => {
      const rate = getPricing(patientType, service.category, timeSlot, doctorType);
      const total = rate * service.quantity;
      return {
        id: `SVC-${Date.now()}-${Math.random()}`,
        description: service.description,
        category: service.category,
        quantity: service.quantity,
        rate,
        total,
      };
    });

    const subTotal = serviceItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const tax = subTotal * 0.05; // 5% tax

    let concession = { percentage: concessionPercentage, amount: concessionAmount, authority: concessionAuthority };
    let concessionValue = 0;

    if (concessionPercentage > 0) {
      concessionValue = (subTotal * concessionPercentage) / 100;
      concession.amount = concessionValue;
    } else if (concessionAmount > 0) {
      concessionValue = concessionAmount;
    }

    const totalAmount = subTotal + tax - concessionValue;
    
    // Generate bill number
    const billSeq = await getNextSequence(db, 'billNumber');
    const billNumber = generateId('BILL', billSeq);

    const derivedBillType = billType || (services.every((service: any) => ['pathology', 'imaging'].includes(service.category)) ? 'lab' : 'consultation');

    const bill = {
      billNumber,
      billType: derivedBillType,
      patientId,
      patientName: patientDetails?.demographics?.fullName || patientName,
      registrationId: registrationId ? toObjectId(registrationId) : null,
      patientType,
      paymentType,
      timeSlot,
      doctorType,
      services: serviceItems,
      subTotal,
      tax,
      concession,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'pending',
      createdBy: toObjectId(user.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bills').insertOne(bill);

    const newBill = await db.collection('bills').findOne({ _id: result.insertedId });

    // Auto transfer relevant services into investigations module.
    const investigationServices = serviceItems.filter((item: any) =>
      item.category === 'pathology' || item.category === 'imaging'
    );

    if (investigationServices.length > 0) {
      let patientAge = 0;
      let patientGender = 'Other';

      const latestRegistration = await db.collection('patientRegistrations').findOne(
        { patientId },
        { sort: { registrationDate: -1 } }
      );

      if (latestRegistration?.demographics) {
        patientAge = Number(latestRegistration.demographics.age || 0);
        patientGender = latestRegistration.demographics.sex || 'Other';
      }

      const investigationDocs = [];
      for (const svc of investigationServices) {
        const invSeq = await getNextSequence(db, 'investigationId');
        const investigationId = generateId('INV', invSeq);

        const testMaster = await db.collection('testMasters').findOne({ testName: svc.description });
        const parameters = (testMaster?.parameters || []).map((param: any) => ({
          name: param.name,
          value: '',
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: false,
          interpretation: null,
          formula: param.formula || null,
          options: param.options || null,
        }));

        investigationDocs.push({
          investigationId,
          patientId,
          patientName: patientDetails?.demographics?.fullName || patientName,
          patientAge,
          patientGender,
          registrationId: registrationId ? toObjectId(registrationId) : null,
          billId: result.insertedId,
          billNumber,
          testName: svc.description,
          testCategory: svc.category === 'pathology' ? 'Pathology' : 'Imaging',
          department: svc.category === 'pathology' ? 'Pathology' : 'Radiology',
          requisitionDate: new Date(),
          requisitionedBy: toObjectId(user.userId),
          clinicalNotes: '',
          parameters,
          status: 'pending',
          source: 'OPD_BILLING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (investigationDocs.length > 0) {
        await db.collection('investigations').insertMany(investigationDocs);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bill created successfully',
      data: {
        bill: newBill,
        receipt: null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create bill error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create bill' },
      { status: 500 }
    );
  }
}