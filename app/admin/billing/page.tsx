'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Plus, X, FileText, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Bill {
  id: string
  patientName: string
  patientId: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'overdue'
  description: string
}

interface ServiceLine {
  id: string
  description: string
  quantity: number
  rate: number
  total: number
}

interface PatientInfo {
  id: string
  name: string
  contact: string
  previousBillingHistory: number
}

export default function BillingPage() {
  const [isClient, setIsClient] = useState(false)
  const [bills] = useState<Bill[]>([
    { id: 'BILL001', patientId: 'PID-2024-001', patientName: 'Alice Brown', amount: 500, date: '2024-03-25', status: 'paid', description: 'Consultation + Tests' },
    { id: 'BILL002', patientId: 'PID-2024-002', patientName: 'David Wilson', amount: 1200, date: '2024-03-24', status: 'pending', description: 'OPD Visit + Investigation' },
    { id: 'BILL003', patientId: 'PID-2024-003', patientName: 'Emma Davis', amount: 300, date: '2024-03-20', status: 'overdue', description: 'Follow-up Consultation' },
  ])

  // Form state
  const [patientId, setPatientId] = useState('')
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [patientType, setPatientType] = useState<'General' | 'VIP' | 'Insurance' | 'Panel'>('General')
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit'>('Cash')
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Evening' | 'Night'>('Morning')
  const [doctorType, setDoctorType] = useState<'General' | 'Emergency'>('General')
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([])
  const [concessionPercent, setConcessionPercent] = useState(0)
  const [concessionAmount, setConcessionAmount] = useState(0)
  const [concessionAuthority, setConcessionAuthority] = useState('')
  const [newService, setNewService] = useState({ description: '', quantity: 1, rate: 0 })
  const [receiptData, setReceiptData] = useState<{ subTotal: number; tax: number; concession: number; total: number } | null>(null)

  const patientDatabase: Record<string, PatientInfo> = {
    'PID-2024-001': { id: 'PID-2024-001', name: 'Alice Brown', contact: '+91-9876543210', previousBillingHistory: 3500 },
    'PID-2024-002': { id: 'PID-2024-002', name: 'David Wilson', contact: '+91-9876543211', previousBillingHistory: 2800 },
    'PID-2024-003': { id: 'PID-2024-003', name: 'Emma Davis', contact: '+91-9876543212', previousBillingHistory: 1200 },
  }

  const pricingRates: Record<string, Record<string, number>> = {
    'General': { consultation: 200, pathology: 300, imaging: 500, procedures: 800 },
    'VIP': { consultation: 400, pathology: 600, imaging: 1000, procedures: 1600 },
    'Insurance': { consultation: 180, pathology: 250, imaging: 400, procedures: 700 },
    'Panel': { consultation: 150, pathology: 200, imaging: 350, procedures: 600 },
  }

  const timeMultipliers = { 'Morning': 1, 'Evening': 1.2, 'Night': 1.5 }
  const emergencyMultiplier = 1.5

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const handleSearchPatient = () => {
    const patient = patientDatabase[patientId]
    if (patient) {
      setPatientInfo(patient)
    } else {
      alert('Patient not found')
      setPatientInfo(null)
    }
  }

  const handleAddService = () => {
    if (newService.description && newService.rate > 0) {
      let rate = newService.rate * timeMultipliers[timeSlot]
      if (doctorType === 'Emergency') {
        rate *= emergencyMultiplier
      }
      const service: ServiceLine = {
        id: `SVC-${Date.now()}`,
        description: newService.description,
        quantity: newService.quantity,
        rate: rate,
        total: rate * newService.quantity,
      }
      setServiceLines([...serviceLines, service])
      setNewService({ description: '', quantity: 1, rate: 0 })
    }
  }

  const handleRemoveService = (id: string) => {
    setServiceLines(serviceLines.filter(s => s.id !== id))
  }

  const calculateSubTotal = () => {
    return serviceLines.reduce((sum, s) => sum + s.total, 0)
  }

  const handleGenerateReceipt = () => {
    const subTotal = calculateSubTotal()
    const tax = subTotal * 0.05
    const concession = concessionPercent > 0 ? (subTotal * concessionPercent) / 100 : concessionAmount
    const total = subTotal + tax - concession
    setReceiptData({ subTotal, tax, concession, total })
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const paidAmount = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">OPD Billing & Collections</h1>
        <p className="text-muted-foreground mt-2 text-base">Comprehensive billing with charges, concessions, and multiple payment options</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Total Revenue</CardTitle>
                <p className="text-3xl font-bold">${totalRevenue}</p>
                <p className="text-xs text-muted-foreground mt-2">This month</p>
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
                <p className="text-3xl font-bold">${paidAmount}</p>
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
                <p className="text-3xl font-bold">${totalRevenue - paidAmount}</p>
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
        <TabsList>
          <TabsTrigger value="create">Create Bill</TabsTrigger>
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        {/* Create Bill Tab */}
        <TabsContent value="create" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Lookup & Selection</CardTitle>
              <CardDescription>Search patient by ID to load billing history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Enter Patient ID (e.g., PID-2024-001)..."
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background"
                />
                <Button onClick={handleSearchPatient} className="gap-2">
                  <Search className="h-4 w-4" />
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
                      <p className="text-lg font-semibold">${patientInfo.previousBillingHistory}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>Set patient type, payment method, and consultation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Patient Category *</label>
                  <select 
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value as any)}
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
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="Credit">Credit (Bill Later)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Consultation Time Slot *</label>
                  <select 
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
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
                    onChange={(e) => setDoctorType(e.target.value as any)}
                    className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                  >
                    <option value="General">General Consultation</option>
                    <option value="Emergency">Emergency Service (+50% charge)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Items</CardTitle>
              <CardDescription>Add consultation and ancillary charges ({patientType} rates)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <label className="text-xs font-medium">Service Type</label>
                  <select 
                    value={newService.description}
                    onChange={(e) => {
                      const rate = pricingRates[patientType][e.target.value] || 0
                      setNewService({ ...newService, description: e.target.value, rate })
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
                    onChange={(e) => setNewService({ ...newService, quantity: parseInt(e.target.value) })}
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
                        <p className="text-sm text-muted-foreground">Qty: {service.quantity} × ${service.rate.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">${service.total.toFixed(2)}</p>
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
                    <label className="text-sm font-medium">Concession (%) *</label>
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
                    <label className="text-sm font-medium">OR Concession Amount ($) *</label>
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
                    <label className="text-sm font-medium">Approval Authority *</label>
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
                <Button onClick={handleGenerateReceipt} className="w-full">
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
                      {serviceLines.map((s) => (
                        <div key={s.id} className="flex justify-between text-sm">
                          <span>{s.description} (x{s.quantity})</span>
                          <span>${s.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${receiptData.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (5%):</span>
                        <span>${receiptData.tax.toFixed(2)}</span>
                      </div>
                      {receiptData.concession > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Concession:</span>
                          <span>-${receiptData.concession.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span>${receiptData.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs mt-4 text-muted-foreground pt-2 border-t">
                        <p>Payment: {paymentType}</p>
                        {concessionAuthority && <p>Concession Approved By: {concessionAuthority}</p>}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" className="flex-1">Print Receipt</Button>
                      <Button variant="outline" className="flex-1">Email Receipt</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Bills Tab */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Bills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bill.patientName}</h3>
                    <p className="text-sm text-muted-foreground">{bill.description} • {bill.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">${bill.amount}</p>
                    {getStatusBadge(bill.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Payments Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bills
                .filter(b => b.status === 'pending' || b.status === 'overdue')
                .map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bill.patientName}</h3>
                    <p className="text-sm text-muted-foreground">${bill.amount} • {bill.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(bill.status)}
                    <Button size="sm">Send Reminder</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
