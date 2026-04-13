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
  createdAt: string
}

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([])
  const [inProgressAppointments, setInProgressAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

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
              <Button size="sm" onClick={() => handleUpdateStatus(apt._id, 'arrived')}>
                Mark Arrived
              </Button>
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
              <Button size="sm" onClick={() => handleUpdateStatus(apt._id, 'completed')}>
                Complete
              </Button>
              <Button size="sm" variant="outline">Add Prescription</Button>
            </>
          )}
          {(apt.status === 'scheduled' || apt.status === 'arrived') && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdateStatus(apt._id, 'cancelled')}>
              Cancel
            </Button>
          )}
          <Button size="sm" variant="outline">View Details</Button>
        </div>
      )}
    </div>
  )

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const totalScheduled = scheduledAppointments.length + inProgressAppointments.length

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
                  scheduledAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No scheduled appointments for this date</p>
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
                  inProgressAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No active consultations</p>
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
                  completedAppointments.map((apt) => (
                    <AppointmentCard key={apt._id} apt={apt} showActions={false} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No completed appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}