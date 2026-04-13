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
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin' && user.role !== 'doctor')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const patientId = url.searchParams.get('patientId');
    const phone = url.searchParams.get('phone');

    let filter: any = {};

    if (patientId) {
      filter.patientId = patientId;
    } else if (phone) {
      filter['demographics.phone'] = phone;
    } else if (query) {
      filter.$or = [
        { patientId: { $regex: query, $options: 'i' } },
        { 'demographics.firstName': { $regex: query, $options: 'i' } },
        { 'demographics.lastName': { $regex: query, $options: 'i' } },
        { 'demographics.phone': { $regex: query, $options: 'i' } },
        { registrationNumber: { $regex: query, $options: 'i' } },
      ];
    } else {
      return NextResponse.json(
        { success: false, message: 'Please provide search query (q, patientId, or phone)' },
        { status: 400 }
      );
    }

    // Get all registrations matching the filter
    const registrations = await db
      .collection('patientRegistrations')
      .find(filter)
      .sort({ registrationDate: -1 })
      .toArray();

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Patient not found',
      });
    }

    // Get the most recent registration
    const latestRegistration = registrations[0];
    
    // Get all visits for this patient
    const allVisits = await db
      .collection('patientRegistrations')
      .find({ patientId: latestRegistration.patientId })
      .sort({ registrationDate: -1 })
      .toArray();

    // Get active prescriptions
    const prescriptions = await db
      .collection('prescriptions')
      .find({ 
        patientId: latestRegistration.patientId,
        status: 'active'
      })
      .toArray();

    // Get upcoming appointments
    const appointments = await db
      .collection('appointments')
      .find({ 
        patientId: latestRegistration.patientId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'arrived'] }
      })
      .sort({ appointmentDate: 1 })
      .toArray();

    // Get billing summary
    const bills = await db
      .collection('bills')
      .find({ patientId: latestRegistration.patientId })
      .toArray();

    const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPaid = bills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    const outstanding = totalBilled - totalPaid;

    const response = {
      patientInfo: latestRegistration,
      totalVisits: allVisits.length,
      lastVisit: allVisits[0]?.registrationDate,
      activePrescriptions: prescriptions,
      upcomingAppointments: appointments,
      billingSummary: {
        totalBilled,
        totalPaid,
        outstanding,
        lastBill: bills[0],
      },
      visitHistory: allVisits.slice(0, 5), // Last 5 visits
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Patient enquiry error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch patient information' },
      { status: 500 }
    );
  }
}