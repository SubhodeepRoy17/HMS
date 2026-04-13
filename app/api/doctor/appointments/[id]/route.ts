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
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(params.id),
      doctorId: new ObjectId(user.userId),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch appointment' },
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
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, notes, appointmentDate, reason } = body;

    const { db } = await connectToDatabase();

    // Verify ownership
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(params.id),
      doctorId: new ObjectId(user.userId),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment
    const updateData: any = { updatedAt: new Date() };
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (reason) updateData.reason = reason;

    await db.collection('appointments').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    const updated = await db.collection('appointments').findOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updated,
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update appointment' },
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
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(params.id),
      doctorId: new ObjectId(user.userId),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    await db.collection('appointments').deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
