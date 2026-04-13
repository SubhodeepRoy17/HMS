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
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const registrationId = url.searchParams.get('registrationId');

    let filter: any = { 
      patientType: 'IPD',
      status: 'active'
    };

    if (registrationId) {
      filter._id = registrationId;
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all active IPD patients
    const ipdPatients = await db
      .collection('patientRegistrations')
      .find(filter)
      .toArray();

    // For each patient, get daily activities
    const dailyReports = await Promise.all(
      ipdPatients.map(async (patient) => {
        // Get consultations for this date
        const consultations = await db
          .collection('consultations')
          .find({
            patientId: patient.patientId,
            consultationDate: { $gte: targetDate, $lt: nextDay }
          })
          .toArray();

        // Get investigations for this date
        const investigations = await db
          .collection('investigations')
          .find({
            patientId: patient.patientId,
            requisitionDate: { $gte: targetDate, $lt: nextDay }
          })
          .toArray();

        // Get medications administered
        const medications = await db
          .collection('medicationAdministrations')
          .find({
            patientId: patient.patientId,
            administeredDate: { $gte: targetDate, $lt: nextDay }
          })
          .toArray();

        // Calculate daily charges
        const roomCharge = await db.collection('rooms').findOne({ roomNumber: patient.roomNumber });
        const dailyRoomCharge = roomCharge?.dailyRate || 0;

        const consultationCharges = consultations.reduce((sum, c) => sum + (c.charges || 0), 0);
        const investigationCharges = investigations.reduce((sum, i) => sum + (i.charges || 0), 0);

        return {
          registrationId: patient._id,
          patientId: patient.patientId,
          patientName: patient.demographics.fullName,
          roomNumber: patient.roomNumber,
          bedNumber: patient.bedNumber,
          consultantName: patient.consultantName,
          admissionDate: patient.admissionDate,
          expectedDischargeDate: patient.expectedDischargeDate,
          dailySummary: {
            date: targetDate,
            consultations: consultations.length,
            investigations: investigations.length,
            medications: medications.length,
            roomCharge: dailyRoomCharge,
            consultationCharges,
            investigationCharges,
            totalDailyCharges: dailyRoomCharge + consultationCharges + investigationCharges,
          },
          consultationsList: consultations,
          investigationsList: investigations,
          medicationsList: medications,
        };
      })
    );

    // Calculate hospital-wide statistics
    const totalPatients = ipdPatients.length;
    const totalDailyRevenue = dailyReports.reduce((sum, report) => 
      sum + report.dailySummary.totalDailyCharges, 0
    );

    return NextResponse.json({
      success: true,
      data: {
        reportDate: targetDate,
        totalIPDPatients: totalPatients,
        totalDailyRevenue,
        patientReports: dailyReports,
      },
    });

  } catch (error) {
    console.error('Inpatient daily report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate inpatient daily report' },
      { status: 500 }
    );
  }
}