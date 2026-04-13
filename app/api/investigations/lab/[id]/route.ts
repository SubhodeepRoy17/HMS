import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  const token = parts[1];
  const verified = verifyToken(token);
  
  return verified;
}

function isAbnormal(value: string, referenceRange: string): boolean {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return numValue < min || numValue > max;
    }
    
    const greaterThanMatch = referenceRange.match(/>\s*(\d+(?:\.\d+)?)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      return numValue < min;
    }
    
    const lessThanMatch = referenceRange.match(/<\s*(\d+(?:\.\d+)?)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      return numValue > max;
    }
    
    return false;
  } catch {
    return false;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, parameters, enteredBy, verificationPassword, reportNotes } = body;
    const investigationId = params.id;

    const { db } = await connectToDatabase();

    const investigation = await db.collection('investigations').findOne({ investigationId });

    if (!investigation) {
      return NextResponse.json(
        { success: false, message: 'Investigation not found' },
        { status: 404 }
      );
    }

    // Update based on action
    if (action === 'enter_results') {
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Only lab technicians can enter results' },
          { status: 403 }
        );
      }

      // Update parameters with results
      const updatedParameters = investigation.parameters.map((param: any) => {
        const newValue = parameters[param.name];
        if (newValue) {
          const abnormal = isAbnormal(newValue, param.referenceRange);
          return {
            ...param,
            value: newValue,
            isAbnormal: abnormal,
            interpretation: abnormal ? 'Out of reference range' : 'Normal',
          };
        }
        return param;
      });

      const updateData: any = {
        parameters: updatedParameters,
        status: 'entered',
        enteredBy: enteredBy || user.userId,
        enteredDate: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('investigations').updateOne(
        { investigationId },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: 'Test results entered successfully',
        data: { ...investigation, ...updateData },
      });
    }

    if (action === 'verify') {
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Only lab managers can verify results' },
          { status: 403 }
        );
      }

      // Verify department passcode
      const validPasscodes: Record<string, string> = {
        'Pathology': 'LAB2024',
        'Cardiology': 'CARDIO2024',
        'Radiology': 'RAD2024',
      };

      if (verificationPassword !== validPasscodes[investigation.department]) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification passcode' },
          { status: 403 }
        );
      }

      const updateData: any = {
        status: 'completed',
        verifiedBy: user.userId,
        verifiedDate: new Date(),
        reportGeneratedDate: new Date(),
        reportNotes: reportNotes || '',
        updatedAt: new Date(),
      };

      await db.collection('investigations').updateOne(
        { investigationId },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: 'Investigation verified and completed',
        data: { ...investigation, ...updateData },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update investigation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update investigation' },
      { status: 500 }
    );
  }
}