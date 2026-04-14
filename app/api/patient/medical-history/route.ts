import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return verifyToken(parts[1]);
}

export async function GET(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    let patientId = user.patientId || null;
    if (!patientId) {
      const patientRegistration = await db.collection('patientRegistrations').findOne(
        { userId: toObjectId(user.userId) },
        { sort: { registrationDate: -1 } }
      );
      patientId = patientRegistration?.patientId || null;
    }

    if (!patientId) {
      return NextResponse.json({
        success: true,
        data: {
          prescriptions: [],
          medicalRecords: [],
        },
      });
    }

    const [prescriptions, medicalRecords] = await Promise.all([
      db.collection('prescriptions').find({ patientId }).sort({ createdAt: -1 }).toArray(),
      db.collection('medicalRecords').find({ patientId }).sort({ createdAt: -1 }).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        prescriptions,
        medicalRecords,
      },
    });
  } catch (error) {
    console.error('Patient medical history error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch medical history' }, { status: 500 });
  }
}
