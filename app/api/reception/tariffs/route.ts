import { NextRequest, NextResponse } from 'next/server';
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
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin' && user.role !== 'doctor')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const baseRates: Record<string, Record<string, number>> = {
      General: { consultation: 200, pathology: 300, imaging: 500, procedure: 800, medicine: 100 },
      VIP: { consultation: 400, pathology: 600, imaging: 1000, procedure: 1600, medicine: 200 },
      Insurance: { consultation: 180, pathology: 250, imaging: 400, procedure: 700, medicine: 90 },
      Panel: { consultation: 150, pathology: 200, imaging: 350, procedure: 600, medicine: 80 },
    };

    const timeMultipliers: Record<string, number> = { Morning: 1, Evening: 1.2, Night: 1.5 };
    const emergencyMultiplier = 1.5;

    return NextResponse.json({
      success: true,
      data: {
        baseRates,
        timeMultipliers,
        emergencyMultiplier,
        notes: [
          'Consultant emergency visits apply emergency multiplier.',
          'Concession can be percentage or fixed amount with authority.',
          'Final amount includes tax as configured in billing module.',
        ],
      },
    });
  } catch (error) {
    console.error('Tariff fetch error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch tariffs' }, { status: 500 });
  }
}
