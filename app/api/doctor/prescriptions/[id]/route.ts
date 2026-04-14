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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { status, medication, dosage, frequency, duration, instructions } = body;

    const { db } = await connectToDatabase();
    const { id } = await params;

    const existing = await db.collection('prescriptions').findOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (medication) updateData.medication = medication;
    if (dosage) updateData.dosage = dosage;
    if (frequency) updateData.frequency = frequency;
    if (duration !== undefined) updateData.duration = duration;
    if (instructions !== undefined) updateData.instructions = instructions;

    await db.collection('prescriptions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await db.collection('prescriptions').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Prescription updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update prescription' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const { id } = await params;

    const result = await db.collection('prescriptions').deleteOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!result.deletedCount) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete prescription' }, { status: 500 });
  }
}
