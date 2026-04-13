'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, CheckCircle2, Loader2, Search, UserCheck, Stethoscope, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface Appointment {
  _id: string
  appointmentId: string
  patientId: string
  patientName: string
  patientPhone: string
  doctorId: string
  doctorName: string
  department: string
  appointmentDate: string
  timeSlot: string
  reason: string
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
}

interface CheckInRecord {
  id: string
  patientName: string
  patientId: string
  arrivalTime: string
  status: 'waiting' | 'checked-in' | 'in-session' | 'completed'
  appointmentId?: string
  doctorName?: string
}

export default function ReceptionistCheckInPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false)
  const [quickCheckInData, setQuickCheckInData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    notes: '',
  })
  const [doctors, setDoctors] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadTodayAppointments()
    loadDoctors()
  }, [])

  const loadTodayAppointments = async () => {
    try {
      setIsLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const response = await receptionApi.getAppointments(undefined, undefined, today)
      if (response.success && response.data) {
        setTodayAppointments(response.data)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const response = await receptionApi.getConsultantInfo()
      if (response.success && response.data) {
        setDoctors(response.data)
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const response = await receptionApi.updateAppointment(appointmentId, { status: 'arrived' })
      if (response.success) {
        toast.success('Patient checked in successfully')
        loadTodayAppointments()
      } else {
        toast.error('Failed to check in patient')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in patient')
    }
  }

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quickCheckInData.patientName || !quickCheckInData.doctorId) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      // For quick check-in, we need to find or create a patient record
      // This would typically involve searching for existing patient or creating new one
      // For now, we'll just show a message
      toast.info('Quick check-in feature: Please use patient search first')
      
      setShowQuickCheckIn(false)
      setQuickCheckInData({
        patientName: '',
        patientPhone: '',
        doctorId: '',
        notes: '',
      })
    } catch (error) {
      console.error('Quick check-in error:', error)
      toast.error('Failed to process check-in')
    } finally {
      setIsSubmitting(false)
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

  const getCheckInStatus = (appointment: Appointment): CheckInRecord['status'] => {
    switch (appointment.status) {
      case 'scheduled':
        return 'waiting'
      case 'arrived':
        return 'checked-in'
      case 'in-progress':
        return 'in-session'
      case 'completed':
        return 'completed'
      default:
        return 'waiting'
    }
  }

  const checkIns: CheckInRecord[] = todayAppointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'no-show')
    .map(apt => ({
      id: apt._id,
      patientName: apt.patientName,
      patientId: apt.patientId,
      arrivalTime: apt.timeSlot,
      status: getCheckInStatus(apt),
      appointmentId: apt.appointmentId,
      doctorName: apt.doctorName,
    }))

  const waitingCount = checkIns.filter(c => c.status === 'waiting').length
  const checkedInCount = checkIns.filter(c => c.status === 'checked-in').length
  const inSessionCount = checkIns.filter(c => c.status === 'in-session').length

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Patient Check-in</h1>
        <p className="text-muted-foreground mt-2 text-base">Process patient arrivals and manage waiting queue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Total Today
                </CardTitle>
                <p className="text-3xl font-bold">{todayAppointments.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Waiting
                </CardTitle>
                <p className="text-3xl font-bold text-yellow-600">{waitingCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Checked-in
                </CardTitle>
                <p className="text-3xl font-bold text-emerald-600">{checkedInCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  In Session
                </CardTitle>
                <p className="text-3xl font-bold text-purple-600">{inSessionCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Stethoscope className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Check-ins ({checkIns.length})</TabsTrigger>
          <TabsTrigger value="waiting">Waiting List ({waitingCount})</TabsTrigger>
          <TabsTrigger value="quick">Quick Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Check-ins</CardTitle>
              <CardDescription>Patients currently in the facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : checkIns.length > 0 ? (
                checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{checkIn.patientName}</h3>
                        {checkIn.status === 'waiting' && (
                          <Badge className="bg-yellow-100 text-yellow-800">Waiting</Badge>
                        )}
                        {checkIn.status === 'checked-in' && (
                          <Badge className="bg-emerald-100 text-emerald-800">Checked-in</Badge>
                        )}
                        {checkIn.status === 'in-session' && (
                          <Badge className="bg-purple-100 text-purple-800">In Session</Badge>
                        )}
                        {checkIn.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <span>ID: {checkIn.patientId}</span>
                        <span>Time: {checkIn.arrivalTime}</span>
                        {checkIn.doctorName && <span>Doctor: {checkIn.doctorName}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {checkIn.status === 'waiting' && (
                        <Button size="sm" onClick={() => handleCheckIn(checkIn.id)}>
                          <UserCheck className="h-4 w-4 mr-1" /> Check-in
                        </Button>
                      )}
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No active check-ins</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waiting" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Waiting Patients</CardTitle>
              <CardDescription>Patients waiting to be seen by doctors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkIns
                .filter(c => c.status === 'waiting')
                .map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{checkIn.patientName}</h3>
                      <p className="text-sm text-muted-foreground">{checkIn.patientId}</p>
                      <p className="text-sm text-muted-foreground mt-1">Arrival: {checkIn.arrivalTime}</p>
                    </div>
                    <Button onClick={() => handleCheckIn(checkIn.id)}>
                      Check-in Now
                    </Button>
                  </div>
                ))}
              {checkIns.filter(c => c.status === 'waiting').length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No patients waiting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Check-in</CardTitle>
              <CardDescription>Quickly register a patient arrival (walk-in)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickCheckIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Patient Name *</label>
                  <input
                    type="text"
                    value={quickCheckInData.patientName}
                    onChange={(e) => setQuickCheckInData({ ...quickCheckInData, patientName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={quickCheckInData.patientPhone}
                    onChange={(e) => setQuickCheckInData({ ...quickCheckInData, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Optional - to find existing record"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Doctor *</label>
                  <select
                    value={quickCheckInData.doctorId}
                    onChange={(e) => setQuickCheckInData({ ...quickCheckInData, doctorId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={quickCheckInData.notes}
                    onChange={(e) => setQuickCheckInData({ ...quickCheckInData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background h-20"
                    placeholder="Reason for visit or special instructions"
                  />
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      For walk-in patients, please search for existing records first. If not found, complete full registration.
                    </p>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Process Check-in
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}