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

function normalizeGender(gender?: string): 'male' | 'female' | 'other' {
  const normalized = (gender || '').toLowerCase();
  if (normalized.startsWith('m')) return 'male';
  if (normalized.startsWith('f')) return 'female';
  return 'other';
}

function pickGenderRange(referenceRange: string, gender?: string): string {
  const g = normalizeGender(gender);
  const maleMatch = referenceRange.match(/M\s*:\s*([^,;]+)/i);
  const femaleMatch = referenceRange.match(/F\s*:\s*([^,;]+)/i);

  if (g === 'male' && maleMatch?.[1]) return maleMatch[1].trim();
  if (g === 'female' && femaleMatch?.[1]) return femaleMatch[1].trim();
  return referenceRange;
}

function isAbnormal(value: string, referenceRange: string, gender?: string): boolean {
  try {
    const resolvedRange = pickGenderRange(referenceRange, gender);
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    const rangeMatch = resolvedRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return numValue < min || numValue > max;
    }
    
    const greaterThanMatch = resolvedRange.match(/>\s*(\d+(?:\.\d+)?)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      return numValue < min;
    }
    
    const lessThanMatch = resolvedRange.match(/<\s*(\d+(?:\.\d+)?)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      return numValue > max;
    }
    
    return false;
  } catch {
    return false;
  }
}

function calculateFormula(formula: string, values: Record<string, string>): string | null {
  const expression = formula.replace(/\{([^}]+)\}/g, (_, key) => {
    const raw = values[key.trim()] || '';
    const numeric = parseFloat(raw);
    return Number.isFinite(numeric) ? String(numeric) : '0';
  });

  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    return null;
  }

  try {
    const computed = Function(`"use strict"; return (${expression});`)();
    if (!Number.isFinite(computed)) return null;
    return String(Number(computed.toFixed(4)));
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { action, parameters, enteredBy, verificationPassword, reportNotes, source } = body;
    const { id: investigationId } = await params;

    const { db } = await connectToDatabase();

    const investigation = await db.collection('investigations').findOne({ investigationId });

    if (!investigation) {
      return NextResponse.json(
        { success: false, message: 'Investigation not found' },
        { status: 404 }
      );
    }

    const actor = await db.collection('users').findOne(
      { _id: toObjectId(user.userId) },
      { projection: { role: 1, department: 1 } }
    );
    const departmentMatched = (actor?.department || '').toLowerCase() === (investigation.department || '').toLowerCase();

    // Update based on action
    if (action === 'enter_results') {
      if (!(user.role === 'admin' || departmentMatched)) {
        return NextResponse.json(
          { success: false, message: 'Only authorized department users can enter results' },
          { status: 403 }
        );
      }

      const incomingValues: Record<string, string> = parameters || {};

      // Update parameters with results
      const updatedParameters = investigation.parameters.map((param: any) => {
        let newValue = incomingValues[param.name];
        if (!newValue && param.formula) {
          const formulaValue = calculateFormula(param.formula, incomingValues);
          if (formulaValue) {
            newValue = formulaValue;
            incomingValues[param.name] = formulaValue;
          }
        }

        if (newValue) {
          const abnormal = isAbnormal(newValue, param.referenceRange, investigation.patientGender);
          const hasOptions = Array.isArray(param.options) && param.options.length > 0;
          const interpretation = hasOptions
            ? (param.options.includes(newValue) ? 'Valid option selected' : 'Value is outside allowed options')
            : (abnormal ? 'Out of reference range' : 'Normal');

          return {
            ...param,
            value: newValue,
            isAbnormal: abnormal,
            interpretation,
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
      if (!(user.role === 'admin' || departmentMatched)) {
        return NextResponse.json(
          { success: false, message: 'Only authorized department users can verify results' },
          { status: 403 }
        );
      }

      // Verify department passcode from admin system settings
      const settingsDoc = await db.collection('systemSettings').findOne({ key: 'global' });
      const configuredPasscodes = settingsDoc?.value?.labVerificationPasscodes as Record<string, string> | undefined;
      const validPasscodes: Record<string, string> = configuredPasscodes || {
        Pathology: 'LAB2024',
        Cardiology: 'CARDIO2024',
        Radiology: 'RAD2024',
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

    if (action === 'import_equipment_results') {
      if (!(user.role === 'admin' || departmentMatched)) {
        return NextResponse.json(
          { success: false, message: 'Only authorized department users can import equipment results' },
          { status: 403 }
        );
      }

      const incomingValues: Record<string, string> = parameters || {};
      const updatedParameters = investigation.parameters.map((param: any) => {
        const newValue = incomingValues[param.name];
        if (!newValue) return param;
        const abnormal = isAbnormal(newValue, param.referenceRange, investigation.patientGender);
        return {
          ...param,
          value: newValue,
          isAbnormal: abnormal,
          interpretation: abnormal ? 'Out of reference range' : 'Normal',
        };
      });

      const updateData: any = {
        parameters: updatedParameters,
        status: 'entered',
        enteredBy: enteredBy || user.userId,
        enteredDate: new Date(),
        equipmentSource: source || 'Integrated Device',
        equipmentImportedAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('investigations').updateOne(
        { investigationId },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: 'Equipment results imported successfully',
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