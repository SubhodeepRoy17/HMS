'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CreditCard, Eye } from 'lucide-react'
import { billingApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface Bill {
  _id: string
  billNumber: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  status: 'paid' | 'pending' | 'partial' | 'overdue'
  billType?: 'consultation' | 'lab'
  createdAt: string
  services?: { description: string; quantity: number; total: number }[]
}

interface PaymentReceipt {
  _id: string
  receiptNumber: string
  billId: string
  billNumber?: string | null
  billType?: 'consultation' | 'lab' | null
  amount: number
  paymentMethod: string
  printedDate?: string
  createdAt: string
}

interface ReceiptDetails {
  receipt: {
    receiptNumber: string
    amount: number
    paymentMethod: string
    transactionId?: string | null
    printedDate?: string
    createdAt?: string
  }
  bill: {
    billNumber: string
    billType?: 'consultation' | 'lab'
    patientName: string
    totalAmount: number
    amountPaid: number
    balanceDue: number
    services?: { description: string; quantity: number; rate?: number; total: number }[]
  }
  printedBy?: {
    firstName?: string
    lastName?: string
    email?: string
  } | null
}

export default function PatientBillingPage() {
  const PAGE_SIZE = 5

  const [isLoading, setIsLoading] = useState(true)
  const [isPayingBillId, setIsPayingBillId] = useState<string | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([])
  const [selectedReceiptDetails, setSelectedReceiptDetails] = useState<ReceiptDetails | null>(null)
  const [isViewingReceipt, setIsViewingReceipt] = useState(false)
  const [billsPage, setBillsPage] = useState(1)
  const [receiptsPage, setReceiptsPage] = useState(1)

  const loadBillingData = async () => {
    try {
      setIsLoading(true)
      const [billsResponse, receiptsResponse] = await Promise.all([
        billingApi.getBills(undefined, 'all', undefined, undefined, 1, 200),
        billingApi.getReceipts(),
      ])

      if (billsResponse.success && billsResponse.data) {
        setBills(billsResponse.data as Bill[])
        setBillsPage(1)
      } else {
        setBills([])
      }

      if (receiptsResponse.success && receiptsResponse.data) {
        setReceipts(receiptsResponse.data as PaymentReceipt[])
        setReceiptsPage(1)
      } else {
        setReceipts([])
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
      toast.error('Failed to load billing details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const pendingBills = useMemo(
    () => bills.filter((bill) => bill.status === 'pending' || bill.status === 'partial' || bill.status === 'overdue'),
    [bills]
  )

  const totalOutstanding = useMemo(
    () => pendingBills.reduce((sum, bill) => sum + (bill.balanceDue || 0), 0),
    [pendingBills]
  )
  const billsTotalPages = Math.max(1, Math.ceil(bills.length / PAGE_SIZE))
  const receiptsTotalPages = Math.max(1, Math.ceil(receipts.length / PAGE_SIZE))
  const paginatedBills = bills.slice((billsPage - 1) * PAGE_SIZE, billsPage * PAGE_SIZE)
  const paginatedReceipts = receipts.slice((receiptsPage - 1) * PAGE_SIZE, receiptsPage * PAGE_SIZE)

  const getStatusBadge = (status: Bill['status']) => {
    const cls: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return <Badge className={cls[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const handlePayNow = async (bill: Bill) => {
    const amountInput = window.prompt(`Enter payment amount (max ${bill.balanceDue})`, bill.balanceDue.toString())
    if (!amountInput) return

    const amount = Number(amountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > bill.balanceDue) {
      toast.error('Amount cannot exceed your outstanding balance')
      return
    }

    const paymentMethod = window.prompt('Payment method (Cash / Card / UPI / Online)', 'Online') || 'Online'

    try {
      setIsPayingBillId(bill._id)
      const response = await billingApi.processPayment(bill._id, amount, paymentMethod)
      if (response.success) {
        const receiptNo = response.data?.receipt?.receiptNumber
        toast.success(receiptNo ? `Payment successful. Receipt: ${receiptNo}` : 'Payment successful')
        loadBillingData()
      } else {
        toast.error(response.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Unable to process payment')
    } finally {
      setIsPayingBillId(null)
    }
  }

  const handleViewReceipt = async (receipt: PaymentReceipt) => {
    try {
      setIsViewingReceipt(true)
      const response = await billingApi.getReceipt(receipt.receiptNumber || receipt._id)
      if (response.success && response.data) {
        setSelectedReceiptDetails(response.data as ReceiptDetails)
      } else {
        toast.error(response.message || 'Unable to load receipt details')
      }
    } catch (error) {
      console.error('Failed to fetch receipt details:', error)
      toast.error('Failed to fetch receipt details')
    } finally {
      setIsViewingReceipt(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">My Billing</h1>
        <p className="text-muted-foreground mt-2">View your bills and pay pending dues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Bills</CardTitle>
            <p className="text-2xl font-bold">{pendingBills.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Outstanding</CardTitle>
            <p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</p>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Billing Records</CardTitle>
          <CardDescription>View your bills and payment receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bills" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
              <TabsTrigger value="bills">Bills ({bills.length})</TabsTrigger>
              <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="bills" className="mt-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : bills.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No bills found</p>
              ) : (
                paginatedBills.map((bill) => (
                  <div key={bill._id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold">{bill.billNumber}</p>
                        <p className="text-sm text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">Type: {(bill.billType || 'consultation').toUpperCase()}</p>
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <p>Total: ₹{bill.totalAmount.toLocaleString()}</p>
                      <p>Paid: ₹{(bill.amountPaid || 0).toLocaleString()}</p>
                      <p>Due: ₹{(bill.balanceDue || 0).toLocaleString()}</p>
                    </div>

                    {(bill.status === 'pending' || bill.status === 'partial' || bill.status === 'overdue') && (
                      <div className="pt-2">
                        <Button
                          onClick={() => handlePayNow(bill)}
                          disabled={isPayingBillId === bill._id}
                        >
                          {isPayingBillId === bill._id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay Now
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {bills.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setBillsPage((prev) => Math.max(1, prev - 1))} disabled={billsPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {billsPage} of {billsTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setBillsPage((prev) => Math.min(billsTotalPages, prev + 1))} disabled={billsPage === billsTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="mt-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : receipts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No receipts found yet</p>
              ) : (
                paginatedReceipts.map((receipt) => (
                  <div key={receipt._id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold">{receipt.receiptNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(receipt.createdAt || receipt.printedDate || Date.now()).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bill: {receipt.billNumber || '-'}
                          {receipt.billType ? ` • ${(receipt.billType || 'consultation').toUpperCase()}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewReceipt(receipt)}
                          disabled={isViewingReceipt}
                          aria-label="View receipt details"
                        >
                          {isViewingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>Amount: ₹{(receipt.amount || 0).toLocaleString()}</p>
                      <p>Method: {receipt.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                ))
              )}
              {receipts.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setReceiptsPage((prev) => Math.max(1, prev - 1))} disabled={receiptsPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {receiptsPage} of {receiptsTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setReceiptsPage((prev) => Math.min(receiptsTotalPages, prev + 1))} disabled={receiptsPage === receiptsTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedReceiptDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedReceiptDetails(null)}>
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Receipt Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReceiptDetails(null)}>✕</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-semibold">{selectedReceiptDetails.receipt.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bill Number</p>
                  <p className="font-semibold">{selectedReceiptDetails.bill.billNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-semibold">{new Date(selectedReceiptDetails.receipt.createdAt || selectedReceiptDetails.receipt.printedDate || Date.now()).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{selectedReceiptDetails.receipt.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-semibold">₹{(selectedReceiptDetails.receipt.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bill Type</p>
                  <p className="font-semibold">{(selectedReceiptDetails.bill.billType || 'consultation').toUpperCase()}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Service Breakdown</h3>
                {selectedReceiptDetails.bill.services && selectedReceiptDetails.bill.services.length > 0 ? (
                  selectedReceiptDetails.bill.services.map((service, idx) => (
                    <div key={`${service.description}-${idx}`} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span>{service.description} (x{service.quantity})</span>
                      <span>₹{(service.total || 0).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No service details available</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Bill Total</p>
                  <p className="font-semibold">₹{(selectedReceiptDetails.bill.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid So Far</p>
                  <p className="font-semibold">₹{(selectedReceiptDetails.bill.amountPaid || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="font-semibold">₹{(selectedReceiptDetails.bill.balanceDue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
