import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
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

    const { db } = await connectToDatabase();

    const rooms = await db
      .collection('rooms')
      .find({})
      .sort({ roomNumber: 1 })
      .toArray();

    const mapped = rooms.map((room: any) => {
      const totalBeds = Number(room.totalBeds || 0);
      const availableBeds = Number(room.availableBeds || 0);
      const occupiedBeds = Math.max(0, totalBeds - availableBeds);
      return {
        roomNumber: room.roomNumber,
        roomType: room.roomType || 'General',
        floor: room.floor || 'N/A',
        totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        dailyRate: Number(room.dailyRate || 0),
      };
    });

    const summary = {
      totalRooms: mapped.length,
      totalBeds: mapped.reduce((sum, item) => sum + item.totalBeds, 0),
      availableBeds: mapped.reduce((sum, item) => sum + item.availableBeds, 0),
      occupiedBeds: mapped.reduce((sum, item) => sum + item.occupiedBeds, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        rooms: mapped,
      },
    });
  } catch (error) {
    console.error('Room status error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch room status' }, { status: 500 });
  }
}
