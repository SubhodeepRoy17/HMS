import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    const doctor = await db
      .collection('users')
      .findOne({
        _id: new ObjectId(params.id),
        role: 'doctor',
      });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { db } = await connectToDatabase();

    // Check if doctor exists
    const existingDoctor = await db
      .collection('users')
      .findOne({
        _id: new ObjectId(params.id),
        role: 'doctor',
      });

    if (!existingDoctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email exists
    if (body.email && body.email.toLowerCase() !== existingDoctor.email) {
      const emailExists = await db
        .collection('users')
        .findOne({ email: body.email.toLowerCase(), _id: { $ne: new ObjectId(params.id) } });

      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update doctor
    const updateData = {
      firstName: body.firstName || existingDoctor.firstName,
      lastName: body.lastName || existingDoctor.lastName,
      email: body.email ? body.email.toLowerCase() : existingDoctor.email,
      phone: body.phone || existingDoctor.phone,
      specialization: body.specialization !== undefined ? body.specialization : existingDoctor.specialization,
      department: body.department !== undefined ? body.department : existingDoctor.department,
      licenseNumber: body.licenseNumber !== undefined ? body.licenseNumber : existingDoctor.licenseNumber,
      qualifications: Array.isArray(body.qualifications) ? body.qualifications : existingDoctor.qualifications,
      isActive: body.isActive !== undefined ? body.isActive : existingDoctor.isActive,
      updatedAt: new Date(),
    };

    const result = await db
      .collection('users')
      .updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Doctor updated successfully',
      data: { _id: params.id, ...updateData },
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if doctor exists
    const doctor = await db
      .collection('users')
      .findOne({
        _id: new ObjectId(params.id),
        role: 'doctor',
      });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Delete doctor
    const result = await db
      .collection('users')
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete doctor' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Doctor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
