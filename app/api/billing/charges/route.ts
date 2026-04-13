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
    const category = url.searchParams.get('category');
    const patientType = url.searchParams.get('patientType');

    // Get charges from database or return default structure
    let charges = await db.collection('serviceCharges').find({}).toArray();
    
    if (charges.length === 0) {
      // Default charges structure
      const defaultCharges = {
        categories: ['consultation', 'pathology', 'imaging', 'procedure', 'medicine'],
        patientTypes: ['General', 'VIP', 'Insurance', 'Panel'],
        timeSlots: ['Morning', 'Evening', 'Night'],
        doctorTypes: ['General', 'Emergency'],
        rates: {
          'General': { consultation: 200, pathology: 300, imaging: 500, procedure: 800, medicine: 100 },
          'VIP': { consultation: 400, pathology: 600, imaging: 1000, procedure: 1600, medicine: 200 },
          'Insurance': { consultation: 180, pathology: 250, imaging: 400, procedure: 700, medicine: 90 },
          'Panel': { consultation: 150, pathology: 200, imaging: 350, procedure: 600, medicine: 80 },
        },
        timeMultipliers: { 'Morning': 1, 'Evening': 1.2, 'Night': 1.5 },
        emergencyMultiplier: 1.5,
        taxRate: 5,
      };
      
      return NextResponse.json({
        success: true,
        data: defaultCharges,
      });
    }

    let filteredCharges = charges;
    if (category) {
      filteredCharges = filteredCharges.filter(c => c.category === category);
    }
    if (patientType) {
      filteredCharges = filteredCharges.filter(c => c.patientType === patientType);
    }

    return NextResponse.json({
      success: true,
      data: filteredCharges,
    });

  } catch (error) {
    console.error('Get charges error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category, patientType, baseRate, timeMultiplier, emergencyMultiplier } = body;

    if (!category || !patientType || !baseRate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const charge = {
      category,
      patientType,
      baseRate,
      timeMultiplier: timeMultiplier || 1,
      emergencyMultiplier: emergencyMultiplier || 1,
      createdBy: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('serviceCharges').insertOne(charge);
    const newCharge = await db.collection('serviceCharges').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Service charge updated successfully',
      data: newCharge,
    }, { status: 201 });

  } catch (error) {
    console.error('Update charges error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update charges' },
      { status: 500 }
    );
  }
}