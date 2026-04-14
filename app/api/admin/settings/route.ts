import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return verifyToken(parts[1]);
}

const defaultSettings = {
  hospitalName: 'MediCare Hospital',
  timezone: 'UTC',
  twoFactorEnabled: false,
  sessionTimeoutMinutes: 30,
  labVerificationPasscodes: {
    Pathology: 'LAB2024',
    Cardiology: 'CARDIO2024',
    Radiology: 'RAD2024',
  },
  emailNotifications: true,
  smsAlerts: false,
  inAppNotifications: true,
  maintenanceMode: false,
  backupSchedule: 'Daily 2:00 AM',
  lastBackup: null,
};

export async function GET(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const settings = await db.collection('systemSettings').findOne({ key: 'global' });

    return NextResponse.json({
      success: true,
      data: settings?.value || defaultSettings,
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { db } = await connectToDatabase();

    const value = {
      ...defaultSettings,
      ...body,
      updatedAt: new Date(),
      updatedBy: new ObjectId(user.userId),
    };

    await db.collection('systemSettings').updateOne(
      { key: 'global' },
      {
        $set: {
          key: 'global',
          value,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: value,
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save settings' }, { status: 500 });
  }
}
