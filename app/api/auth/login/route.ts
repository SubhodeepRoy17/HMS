import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { isValidEmail, comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated. Please contact admin.' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Get patientId if user is a patient
    let patientId = null;
    if (user.role === 'patient') {
      const patientRecord = await db.collection('patientRegistrations').findOne(
        { userId: user._id },
        { sort: { registrationDate: -1 } } // Get most recent registration
      );
      patientId = patientRecord?.patientId || null;
      console.log(`Patient login - userId: ${user._id}, patientId: ${patientId}`);
    }

    // Generate token with patientId
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      patientId: patientId, // CRITICAL: Add patientId to token
    });

    // Return user without password
    const { password: _, _id, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: _id.toString(),
        ...userWithoutPassword,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}