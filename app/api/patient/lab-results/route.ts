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
      return NextResponse.json({ success: true, data: [] });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const filter: Record<string, unknown> = { patientId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const investigations = await db
      .collection('investigations')
      .find(filter)
      .sort({ requisitionDate: -1 })
      .toArray();

    const normalized = investigations.map((item) => ({
      ...item,
      date: item.requisitionDate,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    console.error('Patient lab results error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch lab results' }, { status: 500 });
  }
}
