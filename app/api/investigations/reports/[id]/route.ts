import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId } from '@/lib/db';
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const { id: investigationId } = await params;

    const investigation = await db.collection('investigations').findOne({ investigationId });

    if (!investigation) {
      return NextResponse.json(
        { success: false, message: 'Investigation not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === 'patient') {
      if (!user.patientId || investigation.patientId !== user.patientId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view this report' },
          { status: 403 }
        );
      }
    }

    // Get previous reports for comparison
    const previousReports = await db
      .collection('investigations')
      .find({
        patientId: investigation.patientId,
        testName: investigation.testName,
        status: 'completed',
        investigationId: { $ne: investigationId }
      })
      .sort({ reportGeneratedDate: -1 })
      .limit(3)
      .toArray();

    // Add previous values to parameters
    const parametersWithHistory = investigation.parameters.map((param: any) => {
      let previousValue = null;
      for (const prevReport of previousReports) {
        const prevParam = prevReport.parameters.find((p: any) => p.name === param.name);
        if (prevParam && prevParam.value) {
          previousValue = prevParam.value;
          break;
        }
      }
      return {
        ...param,
        previousValue,
        trend: previousValue ? (parseFloat(param.value) > parseFloat(previousValue) ? 'increased' : 'decreased') : null,
      };
    });

    // Generate report summary
    const abnormalCount = parametersWithHistory.filter((p: any) => p.isAbnormal).length;
    const totalParameters = parametersWithHistory.length;
    const reportSummary = {
      totalParameters,
      abnormalCount,
      isNormal: abnormalCount === 0,
      clinicalSignificance: abnormalCount > 0 ? `${abnormalCount} out of ${totalParameters} parameters are outside normal range` : 'All parameters are within normal range',
    };

    // Get doctor details
    const doctor = await db.collection('users').findOne(
      { _id: investigation.requisitionedBy },
      { projection: { firstName: 1, lastName: 1, specialization: 1 } }
    );

    const report = {
      investigation,
      parameters: parametersWithHistory,
      reportSummary,
      doctor: doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown',
      previousReports: previousReports.map(r => ({
        date: r.reportGeneratedDate,
        reportId: r.investigationId,
      })),
      generatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    );
  }
}