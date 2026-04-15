'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Calendar, Clock, User, Loader2, Search, Filter, CheckCircle, XCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { doctorApi } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'

interface Appointment {
  _id: string
  appointmentId: string
  patientName: string
  patientId: string
  patientPhone?: string
  appointmentDate: string
  timeSlot: string
  reason: string
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  doctorSummary?: string
  createdAt: string
}

interface MedicineEntry {
  medication: string
  dosage: string
  frequency: string
  duration: string
  quantity: string
  rate: string
  instructions: string
}

export default function DoctorAppointmentsPage() {
  const PAGE_SIZE = 5

  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([])
  const [inProgressAppointments, setInProgressAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null)
  const [scheduledPage, setScheduledPage] = useState(1)
  const [inProgressPage, setInProgressPage] = useState(1)
  const [completedPage, setCompletedPage] = useState(1)
  const [consultationSummary, setConsultationSummary] = useState('')
  const [consultationFee, setConsultationFee] = useState('200')
  const [opdConsultation, setOpdConsultation] = useState({
    complaints: '',
    history: '',
    diagnosis: '',
    investigation: '',
    medicines: '',
    advice: '',
    nextVisit: '',
  })
  const [medicines, setMedicines] = useState<MedicineEntry[]>([
    { medication: '', dosage: '', frequency: '', duration: '', quantity: '1', rate: '0', instructions: '' },
  ])

  useEffect(() => {
    setIsClient(true)
    loadAppointments()
  }, [selectedDate])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      
      // Load appointments for selected date
      const response = await doctorApi.getAppointments()
      
      if (response.success && response.data) {
        const allApps = response.data
        
        // Filter by selected date
        const filtered = allApps.filter((apt: Appointment) => 
          new Date(apt.appointmentDate).toISOString().split('T')[0] === selectedDate
        )
        
        setScheduledAppointments(filtered.filter((a: Appointment) => a.status === 'scheduled' || a.status === 'arrived'))
        setInProgressAppointments(filtered.filter((a: Appointment) => a.status === 'in-progress'))
        setCompletedAppointments(filtered.filter((a: Appointment) => a.status === 'completed'))
        setScheduledPage(1)
        setInProgressPage(1)
        setCompletedPage(1)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load appointments'
      toast.error('Error', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await doctorApi.updateAppointment(appointmentId, { status: newStatus })
      
      if (response.success) {
        toast.success(`Appointment ${newStatus}`)
        loadAppointments()
      } else {
        toast.error('Failed to update appointment')
      }
    } catch (err) {
      toast.error('Error updating appointment')
    }
  }

  const openCompleteConsultation = (apt: Appointment) => {
    setCompletingAppointment(apt)
    setConsultationSummary(apt.doctorSummary || '')
    setConsultationFee('200')
    setOpdConsultation({
      complaints: '',
      history: '',
      diagnosis: '',
      investigation: '',
      medicines: '',
      advice: '',
      nextVisit: '',
    })
    setMedicines([{ medication: '', dosage: '', frequency: '', duration: '', quantity: '1', rate: '0', instructions: '' }])
    setShowCompleteModal(true)
  }

  const submitCompleteConsultation = async () => {
    if (!completingAppointment) return

    if (!consultationSummary.trim()) {
      toast.error('Please write consultation summary before completion')
      return
    }

    const filteredMeds = medicines.filter((m) => m.medication && m.dosage && m.frequency)

    try {
      const response = await doctorApi.updateAppointment(completingAppointment._id, {
        status: 'completed',
        doctorSummary: consultationSummary.trim(),
        consultationFee: Number(consultationFee) > 0 ? Number(consultationFee) : 200,
        prescribedMedicines: filteredMeds,
        opdConsultation,
      })

      if (response.success) {
        toast.success('Consultation completed. Summary saved and consultation invoice generated.')
        setShowCompleteModal(false)
        setCompletingAppointment(null)
        loadAppointments()
      } else {
        toast.error(response.message || 'Failed to complete consultation')
      }
    } catch (error) {
      toast.error('Failed to complete consultation')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      arrived: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'no-show': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const AppointmentCard = ({ apt, showActions = true }: { apt: Appointment; showActions?: boolean }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h3 className="font-semibold">{apt.patientName}</h3>
          {getStatusBadge(apt.status)}
          <span className="text-sm text-muted-foreground">ID: {apt.patientId}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(apt.appointmentDate).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{apt.timeSlot}</span>
          <span>{apt.reason}</span>
          {apt.patientPhone && (
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{apt.patientPhone}</span>
          )}
        </div>
        {apt.notes && (
          <p className="text-sm text-muted-foreground mt-2"><strong>Notes:</strong> {apt.notes}</p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2 flex-wrap">
          {apt.status === 'scheduled' && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(apt._id, 'no-show')}>
                No Show
              </Button>
            </>
          )}
          {apt.status === 'arrived' && (
            <Button size="sm" onClick={() => handleUpdateStatus(apt._id, 'in-progress')}>
              Start Consultation
            </Button>
          )}
          {apt.status === 'in-progress' && (
            <>
              <Button size="sm" onClick={() => openCompleteConsultation(apt)}>
                Complete Consultation
              </Button>
            </>
          )}
          {(apt.status === 'scheduled' || apt.status === 'arrived') && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdateStatus(apt._id, 'cancelled')}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info(`Patient: ${apt.patientName} | Reason: ${apt.reason}${apt.doctorSummary ? ` | Summary: ${apt.doctorSummary}` : ''}`)}
          >
            View Details
          </Button>
        </div>
      )}
    </div>
  )

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const totalScheduled = scheduledAppointments.length + inProgressAppointments.length
  const scheduledTotalPages = Math.max(1, Math.ceil(scheduledAppointments.length / PAGE_SIZE))
  const inProgressTotalPages = Math.max(1, Math.ceil(inProgressAppointments.length / PAGE_SIZE))
  const completedTotalPages = Math.max(1, Math.ceil(completedAppointments.length / PAGE_SIZE))

  const paginatedScheduledAppointments = scheduledAppointments.slice((scheduledPage - 1) * PAGE_SIZE, scheduledPage * PAGE_SIZE)
  const paginatedInProgressAppointments = inProgressAppointments.slice((inProgressPage - 1) * PAGE_SIZE, inProgressPage * PAGE_SIZE)
  const paginatedCompletedAppointments = completedAppointments.slice((completedPage - 1) * PAGE_SIZE, completedPage * PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground mt-2 text-base">View and manage your patient appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium mr-2">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-background"
          />
        </div>
        <Button variant="outline" onClick={loadAppointments}>
          <Filter className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList>
            <TabsTrigger value="scheduled">
              Active ({totalScheduled})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointments</CardTitle>
                <CardDescription>Patients waiting to be seen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledAppointments.length > 0 ? (
                  paginatedScheduledAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No scheduled appointments for this date</p>
                  </div>
                )}
                {scheduledAppointments.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScheduledPage((prev) => Math.max(1, prev - 1))}
                      disabled={scheduledPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {scheduledPage} of {scheduledTotalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScheduledPage((prev) => Math.min(scheduledTotalPages, prev + 1))}
                      disabled={scheduledPage === scheduledTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
                <CardDescription>Active consultations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inProgressAppointments.length > 0 ? (
                  paginatedInProgressAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No active consultations</p>
                  </div>
                )}
                {inProgressAppointments.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInProgressPage((prev) => Math.max(1, prev - 1))}
                      disabled={inProgressPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {inProgressPage} of {inProgressTotalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInProgressPage((prev) => Math.min(inProgressTotalPages, prev + 1))}
                      disabled={inProgressPage === inProgressTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Appointments</CardTitle>
                <CardDescription>Past consultations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedAppointments.length > 0 ? (
                  paginatedCompletedAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} showActions={false} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No completed appointments</p>
                  </div>
                )}
                {completedAppointments.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompletedPage((prev) => Math.max(1, prev - 1))}
                      disabled={completedPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {completedPage} of {completedTotalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompletedPage((prev) => Math.min(completedTotalPages, prev + 1))}
                      disabled={completedPage === completedTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {showCompleteModal && completingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCompleteModal(false)}>
          <div className="bg-background rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Complete Consultation</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCompleteModal(false)}>✕</Button>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="font-semibold">{completingAppointment.patientName}</p>
                <p className="text-sm text-muted-foreground">{completingAppointment.patientId} • {completingAppointment.reason}</p>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Doctor Summary (Required)</label>
                  <textarea
                    value={consultationSummary}
                    onChange={(e) => setConsultationSummary(e.target.value)}
                    className="w-full min-h-24 rounded-md border bg-background px-3 py-2"
                    placeholder="Write diagnosis summary, findings, advice and follow-up instructions..."
                  />
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold">Structured OPD Consultation</h3>
                    <p className="text-sm text-muted-foreground">Capture the consultation in discrete clinical fields.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Complaints</label>
                      <textarea
                        value={opdConsultation.complaints}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, complaints: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Chief complaints, symptoms, duration"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">History</label>
                      <textarea
                        value={opdConsultation.history}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, history: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Past history, medication history, relevant background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Diagnosis</label>
                      <textarea
                        value={opdConsultation.diagnosis}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, diagnosis: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Primary diagnosis / impression"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Investigations</label>
                      <textarea
                        value={opdConsultation.investigation}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, investigation: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Comma separated test names"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Medicines Advice</label>
                      <textarea
                        value={opdConsultation.medicines}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, medicines: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Medication advice or prescription notes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Advice</label>
                      <textarea
                        value={opdConsultation.advice}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, advice: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Follow-up instructions, diet, rest, warning signs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Next Visit Date</label>
                      <input
                        type="date"
                        value={opdConsultation.nextVisit}
                        onChange={(e) => setOpdConsultation({ ...opdConsultation, nextVisit: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Consultation Fee</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Prescribed Medicines (optional)</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMedicines([...medicines, { medication: '', dosage: '', frequency: '', duration: '', quantity: '1', rate: '0', instructions: '' }])}
                  >
                    Add Medicine
                  </Button>
                </div>
                {medicines.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded-lg p-3">
                    <input
                      type="text"
                      placeholder="Medicine"
                      value={med.medication}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].medication = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].dosage = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].frequency = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].duration = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={med.quantity}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].quantity = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={med.rate}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].rate = e.target.value
                        setMedicines(next)
                      }}
                      className="px-3 py-2 border rounded-md bg-background"
                    />
                    <textarea
                      placeholder="Instructions"
                      value={med.instructions}
                      onChange={(e) => {
                        const next = [...medicines]
                        next[index].instructions = e.target.value
                        setMedicines(next)
                      }}
                      className="md:col-span-3 px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={submitCompleteConsultation}>Finalize Consultation</Button>
                <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}