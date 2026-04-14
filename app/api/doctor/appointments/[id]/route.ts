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
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
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
  { params }: { params: Promise<{ id: string }> }
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
    const {
      status,
      notes,
      appointmentDate,
      reason,
      doctorSummary,
      consultationFee,
      prescribedMedicines,
      opdConsultation,
    } = body;

    const { db } = await connectToDatabase();
    const { id } = await params;

    // Verify ownership
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (status === 'completed' && (!doctorSummary || !String(doctorSummary).trim()) && !opdConsultation?.diagnosis) {
      return NextResponse.json(
        { success: false, message: 'Doctor summary or diagnosis is required before completing consultation' },
        { status: 400 }
      );
    }

    // Update appointment
    const updateData: any = { updatedAt: new Date() };
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (reason) updateData.reason = reason;
    if (doctorSummary !== undefined) updateData.doctorSummary = doctorSummary;
    if (opdConsultation !== undefined) updateData.opdConsultation = opdConsultation;

    if (status === 'completed' && (!updateData.doctorSummary || !String(updateData.doctorSummary).trim()) && opdConsultation) {
      const summaryParts = [
        opdConsultation.complaints ? `Complaints: ${opdConsultation.complaints}` : '',
        opdConsultation.history ? `History: ${opdConsultation.history}` : '',
        opdConsultation.diagnosis ? `Diagnosis: ${opdConsultation.diagnosis}` : '',
        opdConsultation.advice ? `Advice: ${opdConsultation.advice}` : '',
      ].filter(Boolean);
      updateData.doctorSummary = summaryParts.join(' | ');
    }

    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Prescriptions can only be added during appointment completion.
    const medicines = Array.isArray(prescribedMedicines) ? prescribedMedicines : [];
    if (status === 'completed' && medicines.length > 0) {
      const prescriptionDocs = medicines
        .filter((med: any) => med?.medication && med?.dosage && med?.frequency)
        .map((med: any) => ({
          doctorId: new ObjectId(user.userId),
          appointmentId: new ObjectId(id),
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          medication: med.medication,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration || 'AS NEEDED',
          instructions: med.instructions || '',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      if (prescriptionDocs.length > 0) {
        await db.collection('prescriptions').insertMany(prescriptionDocs);
      }
    }

    // Persist structured OPD clinical note for history/research analysis.
    if (status === 'completed' && opdConsultation) {
      await db.collection('medicalRecords').insertOne({
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        recordType: 'clinical',
        description: opdConsultation.diagnosis || appointment.reason || 'Clinical consultation',
        findings: [
          opdConsultation.complaints ? `Complaints: ${opdConsultation.complaints}` : '',
          opdConsultation.history ? `History: ${opdConsultation.history}` : '',
          opdConsultation.advice ? `Advice: ${opdConsultation.advice}` : '',
          opdConsultation.nextVisit ? `Next Visit: ${opdConsultation.nextVisit}` : '',
        ].filter(Boolean).join('\n'),
        doctorSummary: updateData.doctorSummary || '',
        status: 'active',
        createdBy: new ObjectId(user.userId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // If investigations were advised, create pending requisitions immediately.
      const requestedTests = String(opdConsultation.investigation || '')
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean);

      for (const testName of requestedTests) {
        const seqDoc: any = await db.collection('counters').findOneAndUpdate(
          { _id: 'investigationId' },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' }
        );
        const seq = seqDoc?.seq ?? seqDoc?.value?.seq ?? 1;
        const investigationId = `INV${String(seq).padStart(6, '0')}`;

        const testMaster = await db.collection('testMasters').findOne({ testName });
        const parameters = (testMaster?.parameters || []).map((param: any) => ({
          name: param.name,
          value: '',
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: false,
          interpretation: null,
          formula: param.formula || null,
          options: param.options || null,
        }));

        await db.collection('investigations').insertOne({
          investigationId,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patientAge: 0,
          patientGender: 'Other',
          registrationId: null,
          testName,
          testCategory: 'Pathology',
          department: 'Pathology',
          requisitionDate: new Date(),
          requisitionedBy: new ObjectId(user.userId),
          clinicalNotes: opdConsultation.diagnosis || appointment.reason || '',
          parameters,
          status: 'pending',
          source: 'OPD_CONSULTATION',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Generate consultation bill (consultation + prescribed medicines) once per appointment.
    if (status === 'completed') {
      const existingConsultationBill = await db.collection('bills').findOne({
        appointmentId: new ObjectId(id),
        billType: 'consultation',
      });

      if (!existingConsultationBill) {
        const consultationRate = Number(consultationFee) > 0 ? Number(consultationFee) : 200;
        const medicineItems = medicines
          .filter((med: any) => med?.medication)
          .map((med: any, index: number) => {
            const qty = Number(med.quantity) > 0 ? Number(med.quantity) : 1;
            const rate = Number(med.rate) >= 0 ? Number(med.rate) : 0;
            return {
              id: `MED-${Date.now()}-${index}`,
              description: `${med.medication}${med.dosage ? ` (${med.dosage})` : ''}`,
              category: 'medicine',
              quantity: qty,
              rate,
              total: qty * rate,
            };
          });

        const services = [
          {
            id: `CONS-${Date.now()}`,
            description: `Consultation - ${appointment.doctorName}`,
            category: 'consultation',
            quantity: 1,
            rate: consultationRate,
            total: consultationRate,
          },
          ...medicineItems,
        ];

        const subTotal = services.reduce((sum: number, svc: any) => sum + svc.total, 0);
        const tax = subTotal * 0.05;
        const totalAmount = subTotal + tax;

        const seqDoc: any = await db.collection('counters').findOneAndUpdate(
          { _id: 'billNumber' },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' }
        );
        const seq = seqDoc?.seq ?? seqDoc?.value?.seq ?? 1;
        const billNumber = `BILL${String(seq).padStart(6, '0')}`;

        await db.collection('bills').insertOne({
          billNumber,
          billType: 'consultation',
          appointmentId: new ObjectId(id),
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patientType: 'General',
          paymentType: 'Credit',
          timeSlot: 'Morning',
          doctorType: 'General',
          services,
          subTotal,
          tax,
          concession: { percentage: 0, amount: 0, authority: '' },
          totalAmount,
          amountPaid: 0,
          balanceDue: totalAmount,
          status: 'pending',
          createdBy: new ObjectId(user.userId),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const updated = await db.collection('appointments').findOne({ _id: new ObjectId(id) });

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
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

    // Verify ownership
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      doctorId: new ObjectId(user.userId),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    await db.collection('appointments').deleteOne({ _id: new ObjectId(id) });

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
