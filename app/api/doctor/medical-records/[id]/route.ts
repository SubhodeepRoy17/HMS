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
    const { recordType, description, findings, status } = body;

    const { db } = await connectToDatabase();
    const { id } = await params;

    const existing = await db.collection('medicalRecords').findOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Medical record not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (recordType) updateData.recordType = recordType;
    if (description) updateData.description = description;
    if (findings !== undefined) updateData.findings = findings;
    if (status) updateData.status = status;

    await db.collection('medicalRecords').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await db.collection('medicalRecords').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Medical record updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update medical record' }, { status: 500 });
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

    const result = await db.collection('medicalRecords').deleteOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!result.deletedCount) {
      return NextResponse.json({ success: false, message: 'Medical record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete medical record' }, { status: 500 });
  }
}
