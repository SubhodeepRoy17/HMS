import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, toObjectId, getNextSequence, generateId } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { Document } from 'mongodb';

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
    const user = extractAndVerifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const receiptId = params.id;

    // Find receipt by ID or receipt number
    let receipt;
    if (receiptId.match(/^[0-9a-fA-F]{24}$/)) {
      receipt = await db.collection('paymentReceipts').findOne({ _id: toObjectId(receiptId) });
    } else {
      receipt = await db.collection('paymentReceipts').findOne({ receiptNumber: receiptId });
    }

    if (!receipt) {
      return NextResponse.json(
        { success: false, message: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Get associated bill
    const bill = await db.collection('bills').findOne({ _id: receipt.billId });

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Associated bill not found' },
        { status: 404 }
      );
    }

    // Get user who printed receipt
    const printedBy = await db.collection('users').findOne(
      { _id: receipt.printedBy },
      { projection: { password: 0, firstName: 1, lastName: 1, email: 1 } }
    );

    return NextResponse.json({
      success: true,
      data: {
        receipt,
        bill,
        printedBy,
      },
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = extractAndVerifyAuth(req);
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const billId = params.id;

    const bill = await db.collection('bills').findOne({ _id: toObjectId(billId) });

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    if (bill.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Bill already paid' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount, paymentMethod = 'Cash', transactionId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid payment amount required' },
        { status: 400 }
      );
    }

    const newAmountPaid = bill.amountPaid + amount;
    const newBalanceDue = bill.totalAmount - newAmountPaid;
    const status = newBalanceDue <= 0 ? 'paid' : 'partial';

    // Update bill
    await db.collection('bills').updateOne(
      { _id: toObjectId(billId) },
      {
        $set: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status,
          paymentDate: status === 'paid' ? new Date() : bill.paymentDate,
          updatedAt: new Date(),
        },
      }
    );

    // Generate receipt using getNextSequence function
    const receiptSeq = await getNextSequence(db, 'receiptNumber');
    const receiptNumber = generateId('RCPT', receiptSeq);

    const receipt = {
      receiptNumber,
      billId: toObjectId(billId),
      patientId: bill.patientId,
      patientName: bill.patientName,
      amount,
      paymentMethod,
      transactionId: transactionId || null,
      printedDate: new Date(),
      printedBy: toObjectId(user.userId),
      createdAt: new Date(),
    };

    await db.collection('paymentReceipts').insertOne(receipt);

    // Update patient registration payment status if exists
    if (bill.registrationId) {
      await db.collection('patientRegistrations').updateOne(
        { _id: bill.registrationId },
        { $set: { paymentStatus: status === 'paid' ? 'paid' : 'partial', receiptNumber } }
      );
    }

    const updatedBill = await db.collection('bills').findOne({ _id: toObjectId(billId) });

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        receipt,
        bill: updatedBill,
      },
    });

  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payment' },
      { status: 500 }
    );
  }
}