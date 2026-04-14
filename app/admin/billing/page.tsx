'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Plus, X, FileText, Search, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { billingApi, receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface Bill {
  id: string
  internalId: string
  billNumber: string
  patientName: string
  patientId: string
  amount: number
  amountPaid: number
  balanceDue: number
  date: string
  status: 'paid' | 'pending' | 'partial' | 'overdue'
  billType?: 'consultation' | 'lab'
  description: string
}

interface ServiceLine {
  id: string
  description: string
  category: string
  quantity: number
  rate: number
  total: number
}

interface PatientInfo {
  _id: string
  patientId: string
  name: string
  contact: string
  previousBillingHistory: number
}

export default function BillingPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])

  const [patientQuery, setPatientQuery] = useState('')
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [patientType, setPatientType] = useState<'General' | 'VIP' | 'Insurance' | 'Panel'>('General')
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit' | 'Insurance' | 'Online'>('Cash')
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Evening' | 'Night'>('Morning')
  const [doctorType, setDoctorType] = useState<'General' | 'Emergency'>('General')
  const [billType, setBillType] = useState<'consultation' | 'lab'>('consultation')
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([])
  const [concessionPercent, setConcessionPercent] = useState(0)
  const [concessionAmount, setConcessionAmount] = useState(0)
  const [concessionAuthority, setConcessionAuthority] = useState('')
  const [newService, setNewService] = useState({ description: '', category: '', quantity: 1, rate: 0 })
  const [receiptData, setReceiptData] = useState<{ subTotal: number; tax: number; concession: number; total: number } | null>(null)

  const pricingRates: Record<string, Record<string, number>> = {
    General: { consultation: 200, pathology: 300, imaging: 500, procedures: 800 },
    VIP: { consultation: 400, pathology: 600, imaging: 1000, procedures: 1600 },
    Insurance: { consultation: 180, pathology: 250, imaging: 400, procedures: 700 },
    Panel: { consultation: 150, pathology: 200, imaging: 350, procedures: 600 },
  }

  const timeMultipliers = { Morning: 1, Evening: 1.2, Night: 1.5 }
  const emergencyMultiplier = 1.5

  useEffect(() => {
    setIsClient(true)
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      setIsLoading(true)
      const response = await billingApi.getBills()
      if (response.success && response.data) {
        const mappedBills = (response.data as any[]).map((bill) => ({
          id: bill.billNumber || bill._id,
          internalId: bill._id,
          billNumber: bill.billNumber || bill._id,
          patientName: bill.patientName,
          patientId: typeof bill.patientId === 'string' ? bill.patientId : bill.patientId?.toString?.() || '',
          amount: bill.totalAmount ?? bill.amount ?? 0,
          amountPaid: bill.amountPaid ?? 0,
          balanceDue: bill.balanceDue ?? (bill.totalAmount ?? bill.amount ?? 0),
          date: bill.createdAt ? new Date(bill.createdAt).toISOString().split('T')[0] : '',
          status: bill.status || 'pending',
          billType: bill.billType || 'consultation',
          description: bill.services?.map((s: any) => s.description).join(', ') || 'Billing record',
        }))
        setBills(mappedBills)
      } else {
        setBills([])
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const handleSearchPatient = async () => {
    if (!patientQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await receptionApi.searchPatient(patientQuery)
      if (response.success && response.data?.patientInfo) {
        const patient = response.data.patientInfo
        setPatientInfo({
          _id: patient._id,
          patientId: patient.patientId,
          name: patient.demographics?.fullName || `${patient.demographics?.firstName || ''} ${patient.demographics?.lastName || ''}`.trim(),
          contact: patient.demographics?.phone || '',
          previousBillingHistory: response.data.billingSummary?.totalBilled || 0,
        })
        toast.success('Patient loaded')
      } else {
        setPatientInfo(null)
        toast.info('Patient not found')
      }
    } catch (error) {
      console.error('Patient search error:', error)
      toast.error('Failed to search patient')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddService = () => {
    if (!newService.category) return

    const baseRate = pricingRates[patientType][newService.category] || 0
    const adjustedRate = baseRate * timeMultipliers[timeSlot] * (doctorType === 'Emergency' ? emergencyMultiplier : 1)
    const service = {
      id: `SVC-${Date.now()}`,
      description: newService.description || newService.category,
      category: newService.category,
      quantity: newService.quantity,
      rate: adjustedRate,
      total: adjustedRate * newService.quantity,
    }

    setServiceLines([...serviceLines, service])
    setNewService({ description: '', category: '', quantity: 1, rate: 0 })
  }

  const handleRemoveService = (id: string) => {
    setServiceLines(serviceLines.filter((service) => service.id !== id))
  }

  const calculateSubTotal = () => serviceLines.reduce((sum, service) => sum + service.total, 0)

  const handleGenerateReceipt = async () => {
    if (!patientInfo || serviceLines.length === 0) {
      toast.error('Please select a patient and add at least one service')
      return
    }

    try {
      setIsCreating(true)
      const response = await billingApi.createBill({
        patientId: patientInfo.patientId,
        patientName: patientInfo.name,
        registrationId: patientInfo._id,
        billType,
        patientType,
        paymentType,
        timeSlot,
        doctorType,
        services: serviceLines.map((service) => ({
          description: service.description,
          category: service.category,
          quantity: service.quantity,
        })),
        concessionPercentage: concessionPercent,
        concessionAmount,
        concessionAuthority,
      })

      if (response.success) {
        const bill = response.data?.bill
        if (bill) {
          setReceiptData({
            subTotal: bill.subTotal,
            tax: bill.tax,
            concession: bill.concession?.amount || 0,
            total: bill.totalAmount,
          })
        } else {
          const subTotal = calculateSubTotal()
          const tax = subTotal * 0.05
          const concession = concessionPercent > 0 ? (subTotal * concessionPercent) / 100 : concessionAmount
          const total = subTotal + tax - concession
          setReceiptData({ subTotal, tax, concession, total })
        }

        toast.success('Bill created successfully')
        loadBills()
      } else {
        toast.error(response.message || 'Failed to create bill')
      }
    } catch (error) {
      console.error('Create bill error:', error)
      toast.error('Failed to create bill')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const paidAmount = bills.reduce((sum, bill) => sum + bill.amountPaid, 0)
  const totalOutstanding = bills.reduce((sum, bill) => sum + bill.balanceDue, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">OPD Billing & Collections</h1>
        <p className="text-muted-foreground mt-2 text-base">Real billing workflow with patient lookup, service pricing, and receipt creation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Total Revenue</CardTitle>
                <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">From all bills</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Paid Amount</CardTitle>
                <p className="text-3xl font-bold">₹{paidAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">Collected</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Pending</CardTitle>
                <p className="text-3xl font-bold">₹{totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">Outstanding</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="create">Create Bill</TabsTrigger>
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Lookup & Selection</CardTitle>
              <CardDescription>Search by patient name, patient ID, or phone to load billing history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter patient name, ID, or phone..."
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background"
                />
                <Button onClick={handleSearchPatient} className="gap-2" disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>

              {patientInfo && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                      <p className="text-lg font-semibold">{patientInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact</p>
                      <p className="text-lg">{patientInfo.contact}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Previous Billing Total</p>
                      <p className="text-lg font-semibold">₹{patientInfo.previousBillingHistory.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>Set patient category, payment method, and consultation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Patient Category *</label>
                  <select
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value as typeof patientType)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="General">General Patient</option>
                    <option value="VIP">VIP Patient</option>
                    <option value="Insurance">Insurance Patient</option>
                    <option value="Panel">Panel/Corporate Patient</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Payment Type *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as typeof paymentType)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="Credit">Credit (Bill Later)</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Consultation Time Slot *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as typeof timeSlot)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="Morning">Morning (Standard Rate)</option>
                    <option value="Evening">Evening (+20% surcharge)</option>
                    <option value="Night">Night (+50% surcharge)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Doctor Type *</label>
                  <select
                    value={doctorType}
                    onChange={(e) => setDoctorType(e.target.value as typeof doctorType)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="General">General Consultation</option>
                    <option value="Emergency">Emergency Service (+50% charge)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Invoice Type *</label>
                  <select
                    value={billType}
                    onChange={(e) => setBillType(e.target.value as typeof billType)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="consultation">Consultation + Medicines</option>
                    <option value="lab">Lab Tests</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Items</CardTitle>
              <CardDescription>Add consultation and ancillary charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <label className="text-xs font-medium">Service Type</label>
                  <select
                    value={newService.category}
                    onChange={(e) => {
                      const category = e.target.value
                      setNewService({
                        ...newService,
                        category,
                        description: category,
                        rate: pricingRates[patientType][category] || 0,
                      })
                    }}
                    className="w-full px-2 py-1 mt-1 border rounded text-sm bg-background"
                  >
                    <option value="">Select Service</option>
                    <option value="consultation">Consultation</option>
                    <option value="pathology">Pathology Tests</option>
                    <option value="imaging">Imaging/Scan</option>
                    <option value="procedures">Procedures</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newService.quantity}
                    onChange={(e) => setNewService({ ...newService, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1 mt-1 border rounded text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Base Rate</label>
                  <input
                    type="number"
                    value={newService.rate}
                    readOnly
                    className="w-full px-2 py-1 mt-1 border rounded text-sm bg-muted opacity-60"
                  />
                </div>
                <div className="flex items-end">
                  <Button size="sm" onClick={handleAddService} className="w-full gap-1">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              {serviceLines.length > 0 && (
                <div className="space-y-2">
                  {serviceLines.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{service.description}</p>
                        <p className="text-sm text-muted-foreground">Qty: {service.quantity} × ₹{service.rate.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">₹{service.total.toFixed(2)}</p>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveService(service.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {serviceLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Concession & Adjustments</CardTitle>
                <CardDescription>Apply discounts with required approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Concession (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={concessionPercent}
                      onChange={(e) => {
                        setConcessionPercent(parseInt(e.target.value) || 0)
                        setConcessionAmount(0)
                      }}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">OR Concession Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={concessionAmount}
                      onChange={(e) => {
                        setConcessionAmount(parseInt(e.target.value) || 0)
                        setConcessionPercent(0)
                      }}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Approval Authority</label>
                    <input
                      type="text"
                      placeholder="Manager/HOD Name"
                      value={concessionAuthority}
                      onChange={(e) => setConcessionAuthority(e.target.value)}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {serviceLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Receipt Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGenerateReceipt} className="w-full" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generate Receipt
                </Button>

                {receiptData && (
                  <div className="p-6 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
                    <div className="mb-6 pb-4 border-b">
                      <h3 className="text-xl font-bold">RECEIPT</h3>
                      <p className="text-sm text-muted-foreground">Patient: {patientInfo?.name}</p>
                      <p className="text-sm text-muted-foreground">Date: {new Date().toISOString().split('T')[0]}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {serviceLines.map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span>{service.description} (x{service.quantity})</span>
                          <span>₹{service.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{receiptData.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (5%):</span>
                        <span>₹{receiptData.tax.toFixed(2)}</span>
                      </div>
                      {receiptData.concession > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Concession:</span>
                          <span>-₹{receiptData.concession.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span>₹{receiptData.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs mt-4 text-muted-foreground pt-2 border-t">
                        <p>Payment: {paymentType}</p>
                        {concessionAuthority && <p>Concession Approved By: {concessionAuthority}</p>}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => window.print()}>Print Receipt</Button>
                      <Button variant="outline" className="flex-1" onClick={() => toast.info('Email receipt can be added to your mail service integration')}>Email Receipt</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Bills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : bills.length > 0 ? (
                bills.map((bill) => (
                  <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold">{bill.patientName}</h3>
                      <p className="text-sm text-muted-foreground">{bill.description} • {bill.date}</p>
                      <p className="text-xs text-muted-foreground">Patient ID: {bill.patientId}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                      <p className="font-semibold">₹{bill.amount.toLocaleString()}</p>
                      {getStatusBadge(bill.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No bills found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Billing status is visible to admin. Patients complete payments from their portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bills.filter((bill) => bill.status === 'pending' || bill.status === 'partial' || bill.status === 'overdue').length > 0 ? (
                bills
                  .filter((bill) => bill.status === 'pending' || bill.status === 'partial' || bill.status === 'overdue')
                  .map((bill) => (
                    <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold">{bill.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Bill: {bill.billNumber} • {bill.date} • Type: {(bill.billType || 'consultation').toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total: ₹{bill.amount.toLocaleString()} • Due: ₹{bill.balanceDue.toLocaleString()}</p>
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No pending bills</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
