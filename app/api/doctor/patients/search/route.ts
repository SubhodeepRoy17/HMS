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

export async function GET(req: NextRequest) {
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
    
    // Get search query
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        message: 'Provide at least 2 characters to search',
        data: [],
      });
    }

    // Search patients by name or email
    const patients = await db
      .collection('users')
      .find({
        role: 'patient',
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
      .project({
        password: 0,
        isEmailVerified: 0,
      })
      .limit(limit)
      .toArray();

    // Get appointment history with each patient
    const patientsWithHistory = await Promise.all(
      patients.map(async (patient) => {
        const appointmentCount = await db.collection('appointments').countDocuments({
          patientId: patient._id,
          doctorId: new ObjectId(user.userId),
        });

        return {
          ...patient,
          appointmentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Patients found',
      data: patientsWithHistory,
    });

  } catch (error) {
    console.error('Search patients error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search patients' },
      { status: 500 }
    );
  }
}
