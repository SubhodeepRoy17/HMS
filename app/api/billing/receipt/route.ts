import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, toObjectId } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function extractAndVerifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return verifyToken(parts[1])
}

export async function GET(req: NextRequest) {
  try {
    const user = extractAndVerifyAuth(req)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    let resolvedPatientId: string | undefined

    if (user.role === 'patient') {
      resolvedPatientId = user.patientId as string | undefined

      if (!resolvedPatientId) {
        const patientRegistration = await db.collection('patientRegistrations').findOne(
          { userId: toObjectId(user.userId) },
          { sort: { registrationDate: -1 }, projection: { patientId: 1 } }
        )
        resolvedPatientId = patientRegistration?.patientId
      }

      if (!resolvedPatientId) {
        return NextResponse.json({ success: true, data: [] })
      }
    }

    // For now this endpoint is patient-focused for portal usage.
    if (user.role !== 'patient') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const receipts = await db
      .collection('paymentReceipts')
      .find({ patientId: resolvedPatientId })
      .sort({ createdAt: -1 })
      .toArray()

    const billIds = receipts.map((receipt) => receipt.billId).filter(Boolean)
    const bills = billIds.length
      ? await db.collection('bills').find({ _id: { $in: billIds } }).toArray()
      : []

    const billMap = new Map(bills.map((bill) => [String(bill._id), bill]))

    const normalized = receipts.map((receipt) => {
      const bill = billMap.get(String(receipt.billId))
      return {
        ...receipt,
        billNumber: bill?.billNumber || null,
        billType: bill?.billType || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: normalized,
    })
  } catch (error) {
    console.error('List receipts error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch receipts' }, { status: 500 })
  }
}
