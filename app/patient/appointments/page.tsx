'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { patientApi } from '@/lib/api-client'
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
  doctorSummary?: string
  createdAt: string
}

export default function PatientAppointmentsPage() {
  const PAGE_SIZE = 5

  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [summaryAppointment, setSummaryAppointment] = useState<Appointment | null>(null)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [pastPage, setPastPage] = useState(1)

  useEffect(() => {
    setIsClient(true)
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await patientApi.getMyAppointments()
      if (response.success && response.data && Array.isArray(response.data)) {
        setAppointments(response.data)
        setUpcomingPage(1)
        setPastPage(1)
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
  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingAppointments.length / PAGE_SIZE))
  const pastTotalPages = Math.max(1, Math.ceil(pastAppointments.length / PAGE_SIZE))
  const paginatedUpcomingAppointments = upcomingAppointments.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE)
  const paginatedPastAppointments = pastAppointments.slice((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE)

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground mt-2 text-base">View your appointment timeline and status updates</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
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
                paginatedUpcomingAppointments.map((apt) => (
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
                      <Badge variant="outline">Managed by reception</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </div>
              )}
              {upcomingAppointments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setUpcomingPage((prev) => Math.max(1, prev - 1))} disabled={upcomingPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {upcomingPage} of {upcomingTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setUpcomingPage((prev) => Math.min(upcomingTotalPages, prev + 1))} disabled={upcomingPage === upcomingTotalPages}>
                    Next
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
                paginatedPastAppointments.map((apt) => (
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
                      <Button size="sm" variant="outline" onClick={() => setSummaryAppointment(apt)}>
                        View Summary
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No past appointments</p>
                </div>
              )}
              {pastAppointments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPastPage((prev) => Math.max(1, prev - 1))} disabled={pastPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {pastPage} of {pastTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPastPage((prev) => Math.min(pastTotalPages, prev + 1))} disabled={pastPage === pastTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {summaryAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSummaryAppointment(null)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Consultation Summary</h2>
                <Button variant="ghost" size="sm" onClick={() => setSummaryAppointment(null)}>✕</Button>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="font-semibold">{summaryAppointment.doctorName}</p>
                <p className="text-sm text-muted-foreground">{new Date(summaryAppointment.appointmentDate).toLocaleDateString()} • {summaryAppointment.timeSlot}</p>
                <p className="text-sm mt-2"><strong>Reason:</strong> {summaryAppointment.reason}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Doctor Notes</p>
                <div className="p-4 rounded-lg border min-h-20 whitespace-pre-wrap">
                  {summaryAppointment.doctorSummary || 'No summary shared yet by doctor.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}