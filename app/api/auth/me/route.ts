import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token missing' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(payload.userId),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // FIXED: Get patientId if user is a patient
    let patientId = payload.patientId || null;
    
    if (user.role === 'patient' && !patientId) {
      // Look up patientId from database if not in token
      const patientRecord = await db.collection('patientRegistrations').findOne(
        { userId: user._id },
        { sort: { registrationDate: -1 } }
      );
      patientId = patientRecord?.patientId || null;
    }

    // Return user without password
    const { password, _id, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: {
        _id: _id.toString(),
        ...userWithoutPassword,
        patientId: patientId,  // ✅ ADD patientId to response
      },
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}