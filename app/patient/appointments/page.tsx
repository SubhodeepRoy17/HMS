'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Loader2, Plus, X, Stethoscope } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { patientApi, receptionApi } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'

interface Appointment {
  _id: string
  appointmentId: string
  doctorName: string
  doctorId: string
  department: string
  appointmentDate: string  // FIXED: changed from 'date' to 'appointmentDate'
  timeSlot: string
  reason: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress'
  notes?: string
  createdAt: string
}

interface Doctor {
  _id: string
  firstName: string
  lastName: string
  specialization: string
  department: string
  availableSlots?: string[]
}

export default function PatientAppointmentsPage() {
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showBookForm, setShowBookForm] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    notes: '',
  })

  useEffect(() => {
    setIsClient(true)
    loadAppointments()
    loadDoctors()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await patientApi.getMyAppointments()
      if (response.success && response.data && Array.isArray(response.data)) {
        setAppointments(response.data)
      } else {
        setAppointments([])
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
      if (response.success && response.data && Array.isArray(response.data)) {
        setDoctors(response.data)
      } else {
        setDoctors([])
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
      setDoctors([])
    }
  }

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return
    
    try {
      const response = await receptionApi.getDoctorSchedules(doctorId, undefined, date)
      if (response.success && response.data && response.data.length > 0) {
        const schedule = response.data[0]
        const availableSlots = schedule.timeSlots
          .filter((slot: any) => slot.isAvailable)
          .map((slot: any) => slot.startTime)
        setAvailableTimeSlots(availableSlots)
      } else {
        setAvailableTimeSlots([])
      }
    } catch (error) {
      console.error('Error loading time slots:', error)
      setAvailableTimeSlots([])
    }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setFormData({ ...formData, doctorId: doctor._id })
  }

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, appointmentDate: date, timeSlot: '' })
    if (formData.doctorId) {
      loadAvailableTimeSlots(formData.doctorId, date)
    }
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.doctorId || !formData.appointmentDate || !formData.timeSlot || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await patientApi.bookAppointment({
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason,
        notes: formData.notes,
      })

      if (response.success) {
        toast.success('Appointment booked successfully')
        setShowBookForm(false)
        setSelectedDoctor(null)
        setFormData({
          doctorId: '',
          appointmentDate: '',
          timeSlot: '',
          reason: '',
          notes: '',
        })
        loadAppointments()
      } else {
        toast.error(response.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Book appointment error:', error)
      toast.error('Failed to book appointment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      const response = await patientApi.cancelAppointment(appointmentId)
      if (response.success) {
        toast.success('Appointment cancelled')
        loadAppointments()
      } else {
        toast.error(response.message || 'Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Cancel appointment error:', error)
      toast.error('Failed to cancel appointment')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled')
  const pastAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled')

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground mt-2 text-base">View, manage, and book appointments with doctors</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
          <TabsTrigger value="book">Book New</TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{apt.doctorName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{apt.department}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {apt.timeSlot}
                        </span>
                      </div>
                      <p className="text-sm mt-2"><strong>Reason:</strong> {apt.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCancelAppointment(apt._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="outline">Reschedule</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Button className="mt-4" onClick={() => setShowBookForm(true)}>
                    Book an Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Appointments Tab */}
        <TabsContent value="past" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>Your appointment history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{apt.doctorName}</h3>
                      <p className="text-sm text-muted-foreground">{apt.department}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(apt.status)}
                      <Button size="sm" variant="outline">View Summary</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No past appointments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Book New Appointment Tab */}
        <TabsContent value="book" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Book New Appointment</CardTitle>
              <CardDescription>Schedule a consultation with a doctor</CardDescription>
            </CardHeader>
            <CardContent>
              {!showBookForm ? (
                <Button onClick={() => setShowBookForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Schedule New Appointment
                </Button>
              ) : (
                <form onSubmit={handleBookAppointment} className="space-y-6">
                  {/* Doctor Selection */}
                  {!selectedDoctor ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Select a Doctor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                          <div
                            key={doctor._id}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Stethoscope className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </h4>
                                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                                <p className="text-sm text-muted-foreground">{doctor.department}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {doctors.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No doctors available</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Selected Doctor Info */}
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Selected Doctor</p>
                          <p className="font-semibold">
                            Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDoctor(null)}>
                          <X className="h-4 w-4 mr-1" /> Change
                        </Button>
                      </div>

                      {/* Appointment Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {availableTimeSlots.length === 0 && formData.appointmentDate && (
                              <p className="text-xs text-amber-600 mt-1">No available slots for selected date</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Reason for Visit *</label>
                            <textarea
                              value={formData.reason}
                              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              rows={2}
                              placeholder="Describe your symptoms or reason for consultation"
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
                              placeholder="Any specific concerns or questions"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Confirm Booking
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                          setShowBookForm(false)
                          setSelectedDoctor(null)
                        }}>
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