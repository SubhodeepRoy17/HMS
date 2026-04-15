'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Loader2, Search, X, Stethoscope, Phone, Mail } from 'lucide-react'
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
  notes?: string
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  createdAt: string
}

interface Doctor {
  _id: string
  firstName: string
  lastName: string
  specialization: string
  department: string
}

interface PatientSearchResult {
  _id: string
  patientId: string
  demographics: {
    fullName: string
    phone: string
    age: number
  }
}

export default function ReceptionistAppointmentsPage() {
  const PAGE_SIZE = 5

  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  
  // Form state
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([])
  const [isSearchingPatient, setIsSearchingPatient] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [todayPage, setTodayPage] = useState(1)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [allPage, setAllPage] = useState(1)

  useEffect(() => {
    setIsClient(true)
    loadAppointments()
    loadDoctors()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await receptionApi.getAppointments(undefined, undefined, undefined, undefined, 1, 1000)
      if (response.success && response.data) {
        setAppointments(response.data)
        setTodayPage(1)
        setUpcomingPage(1)
        setAllPage(1)
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

  const searchPatients = async () => {
    if (!searchPatientQuery.trim()) return
    
    try {
      setIsSearchingPatient(true)
      const response = await receptionApi.searchPatient(searchPatientQuery)
      if (response.success && response.data) {
        setPatientSearchResults(response.data.patientInfo ? [response.data.patientInfo] : [])
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      toast.error('Failed to search patients')
    } finally {
      setIsSearchingPatient(false)
    }
  }

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => {
    const response = await receptionApi.getDoctorSchedules(doctorId, undefined, date)
    if (response.success && response.data && response.data.length > 0) {
      const schedule = response.data[0]
      const availableSlots = schedule.timeSlots
        .filter((slot: any) => slot.isAvailable)
        .map((slot: any) => slot.startTime)
      setAvailableTimeSlots(availableSlots)
    }
  }

  const handleDoctorChange = (doctorId: string) => {
    setFormData({ ...formData, doctorId, timeSlot: '' })
    if (formData.appointmentDate) {
      loadAvailableTimeSlots(doctorId, formData.appointmentDate)
    }
  }

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, appointmentDate: date, timeSlot: '' })
    if (formData.doctorId) {
      loadAvailableTimeSlots(formData.doctorId, date)
    }
  }

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient || !formData.doctorId || !formData.appointmentDate || !formData.timeSlot || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    const selectedDoctor = doctors.find(d => d._id === formData.doctorId)
    if (!selectedDoctor) {
      toast.error('Selected doctor not found')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await receptionApi.createAppointment({
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.demographics.fullName,
        patientPhone: selectedPatient.demographics.phone,
        doctorId: formData.doctorId,
        doctorName: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        department: selectedDoctor.department,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason,
        notes: formData.notes,
      })

      if (response.success) {
        toast.success('Appointment scheduled successfully')
        // Reset form
        setSelectedPatient(null)
        setSearchPatientQuery('')
        setPatientSearchResults([])
        setFormData({
          doctorId: '',
          appointmentDate: '',
          timeSlot: '',
          reason: '',
          notes: '',
        })
        setShowScheduleForm(false)
        loadAppointments()
      } else {
        toast.error(response.message || 'Failed to schedule appointment')
      }
    } catch (error) {
      console.error('Schedule appointment error:', error)
      toast.error('Failed to schedule appointment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await receptionApi.updateAppointment(appointmentId, { status: newStatus })
      if (response.success) {
        toast.success(`Appointment ${newStatus}`)
        loadAppointments()
      } else {
        toast.error('Failed to update appointment')
      }
    } catch (error) {
      console.error('Update appointment error:', error)
      toast.error('Failed to update appointment')
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      const response = await receptionApi.cancelAppointment(appointmentId)
      if (response.success) {
        toast.success('Appointment cancelled')
        loadAppointments()
      } else {
        toast.error('Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Cancel appointment error:', error)
      toast.error('Failed to cancel appointment')
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

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(apt => apt.appointmentDate.split('T')[0] === today)
  }

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(apt => apt.appointmentDate.split('T')[0] > today && apt.status === 'scheduled')
  }

  const handleViewDetails = (apt: Appointment) => {
    toast.info(`Patient: ${apt.patientName} | Doctor: ${apt.doctorName} | Date: ${new Date(apt.appointmentDate).toLocaleDateString()} ${apt.timeSlot}`)
  }

  const handleReschedule = (apt: Appointment) => {
    toast.info(`Use the Appointments API reschedule flow for ${apt.appointmentId}. UI form can be added next.`)
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const todayAppointments = getTodayAppointments()
  const upcomingAppointments = getUpcomingAppointments()

  const todayTotalPages = Math.max(1, Math.ceil(todayAppointments.length / PAGE_SIZE))
  const paginatedTodayAppointments = todayAppointments.slice((todayPage - 1) * PAGE_SIZE, todayPage * PAGE_SIZE)

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingAppointments.length / PAGE_SIZE))
  const paginatedUpcomingAppointments = upcomingAppointments.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE)

  const allTotalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE))
  const paginatedAllAppointments = appointments.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Appointment Management</h1>
        <p className="text-muted-foreground mt-2 text-base">Schedule and manage patient appointments</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule ({todayAppointments.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="all">All Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule New</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>Schedule for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : todayAppointments.length > 0 ? (
                paginatedTodayAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{apt.patientName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{apt.timeSlot}</span>
                        <span className="flex items-center gap-1"><User className="h-4 w-4" />{apt.doctorName}</span>
                        <span>{apt.department}</span>
                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{apt.patientPhone}</span>
                      </div>
                      <p className="text-sm mt-2"><strong>Reason:</strong> {apt.reason}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {apt.status === 'scheduled' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(apt.appointmentId, 'arrived')}>
                          Mark Arrived
                        </Button>
                      )}
                      {(apt.status === 'arrived' || apt.status === 'in-progress' || apt.status === 'completed') && (
                        <Badge className="bg-green-100 text-green-800">Checked In</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(apt)}>View Details</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </div>
              )}
              {todayAppointments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTodayPage((prev) => Math.max(1, prev - 1))}
                    disabled={todayPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {todayPage} of {todayTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTodayPage((prev) => Math.min(todayTotalPages, prev + 1))}
                    disabled={todayPage === todayTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                paginatedUpcomingAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="font-semibold">{apt.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot} • {apt.doctorName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancelAppointment(apt.appointmentId)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReschedule(apt)}>Reschedule</Button>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No upcoming appointments found</p>
                </div>
              )}
              {upcomingAppointments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage((prev) => Math.max(1, prev - 1))}
                    disabled={upcomingPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {upcomingPage} of {upcomingTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage((prev) => Math.min(upcomingTotalPages, prev + 1))}
                    disabled={upcomingPage === upcomingTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>Complete appointment list across dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments.length > 0 ? (
                paginatedAllAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{apt.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot} • {apt.doctorName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelAppointment(apt.appointmentId)}
                        disabled={apt.status === 'completed'}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReschedule(apt)}>Reschedule</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No appointments found</p>
                </div>
              )}
              {appointments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllPage((prev) => Math.max(1, prev - 1))}
                    disabled={allPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {allPage} of {allTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllPage((prev) => Math.min(allTotalPages, prev + 1))}
                    disabled={allPage === allTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
              <CardDescription>Book a new patient appointment</CardDescription>
            </CardHeader>
            <CardContent>
              {!showScheduleForm ? (
                <Button onClick={() => setShowScheduleForm(true)} className="w-full">
                  + New Appointment
                </Button>
              ) : (
                <form onSubmit={handleScheduleAppointment} className="space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Patient Information</h3>
                    {!selectedPatient ? (
                      <div>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search by patient name, ID, or phone..."
                              value={searchPatientQuery}
                              onChange={(e) => setSearchPatientQuery(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border rounded-md bg-background"
                            />
                          </div>
                          <Button type="button" onClick={searchPatients} disabled={isSearchingPatient}>
                            {isSearchingPatient ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                          </Button>
                        </div>
                        
                        {patientSearchResults.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {patientSearchResults.map((patient) => (
                              <div key={patient._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-semibold">{patient.demographics.fullName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {patient.patientId} • Phone: {patient.demographics.phone}
                                  </p>
                                </div>
                                <Button type="button" size="sm" onClick={() => setSelectedPatient(patient)}>
                                  Select
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold">{selectedPatient.demographics.fullName}</p>
                          <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                          <X className="h-4 w-4" /> Change
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedPatient && (
                    <>
                      {/* Appointment Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Doctor *</label>
                            <select
                              value={formData.doctorId}
                              onChange={(e) => handleDoctorChange(e.target.value)}
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
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                              type="date"
                              value={formData.appointmentDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleDateChange(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Time Slot *</label>
                            <select
                              value={formData.timeSlot}
                              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              required
                              disabled={availableTimeSlots.length === 0}
                            >
                              <option value="">Select Time Slot</option>
                              {availableTimeSlots.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                            {availableTimeSlots.length === 0 && formData.doctorId && formData.appointmentDate && (
                              <p className="text-xs text-amber-600 mt-1">No available slots for selected doctor/date</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Reason for Visit *</label>
                            <textarea
                              value={formData.reason}
                              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              rows={2}
                              placeholder="e.g., Fever, Consultation, Follow-up"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Additional Notes</label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              rows={2}
                              placeholder="Any special instructions or notes"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Schedule Appointment
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}