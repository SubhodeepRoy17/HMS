import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Extract and verify token
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (payload.role !== 'patient') {
      return NextResponse.json(
        { success: false, message: 'Only patients can access this endpoint' },
        { status: 403 }
      );
    }

    if (!payload.patientId) {
      return NextResponse.json(
        { success: false, message: 'Patient ID not found in token' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let filter: any = { patientId: payload.patientId };
    if (status && status !== 'all') filter.status = status;

    const appointments = await db.collection('appointments')
      .find(filter)
      .sort({ appointmentDate: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: appointments,
      count: appointments.length,
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
    return NextResponse.json({
      success: false,
      message: 'Patients cannot create appointments. Please contact reception.',
    }, { status: 403 });

  } catch (error) {
    console.error('Book appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return NextResponse.json({
      success: false,
      message: 'Patients cannot cancel appointments directly. Please contact reception.',
    }, { status: 403 });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}