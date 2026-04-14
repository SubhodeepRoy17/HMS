import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, hashPassword, isValidEmail, isValidPhone } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role && role !== 'all') {
      filter.role = role;
    }

    const total = await db.collection('users').countDocuments(filter);

    const users = await db
      .collection('users')
      .find(filter)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convert ObjectId to string for each user
    const serializedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      message: 'Users retrieved',
      data: serializedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, password, confirmPassword, role, department, specialization } = body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email) || !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or phone format' },
        { status: 400 }
      );
    }

    if (!['doctor', 'receptionist'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Admin can only create doctor or receptionist accounts' },
        { status: 400 }
      );
    }

    if (role === 'doctor' && (!department || !specialization)) {
      return NextResponse.json(
        { success: false, message: 'Department and specialization are required for doctor accounts' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      role,
      department: role === 'doctor' ? department : '',
      specialization: role === 'doctor' ? specialization : '',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      message: `${role === 'doctor' ? 'Doctor' : 'Receptionist'} account created successfully`,
      data: {
        _id: result.insertedId.toString(),
        ...userWithoutPassword,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}