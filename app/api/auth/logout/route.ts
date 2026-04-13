import { NextRequest, NextResponse } from 'next/server';
import { AuthResponse } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
