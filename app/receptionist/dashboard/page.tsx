'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, CheckCircle2, Clock, Calendar, UserPlus, 
  Stethoscope, TrendingUp, AlertCircle, Loader2,
  Phone, Mail, MapPin, Activity
} from 'lucide-react'
import { receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardStats {
  todayAppointments: number
  checkedInCount: number
  waitingCount: number
  completedCount: number
  newRegistrations: number
  occupancyRate: number
  totalPatientsToday: number
  nextVisitDate: string
}

interface RecentActivity {
  id: string
  type: 'registration' | 'checkin' | 'appointment' | 'discharge'
  description: string
  time: string
  patientName: string
}

export default function ReceptionistDashboard() {
  const TODAY_PAGE_SIZE = 5
  const ACTIVITY_PAGE_SIZE = 3

  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    checkedInCount: 0,
    waitingCount: 0,
    completedCount: 0,
    newRegistrations: 0,
    occupancyRate: 0,
    totalPatientsToday: 0,
    nextVisitDate: 'No follow-up scheduled',
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [todayPage, setTodayPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)

  const formatDisplayDate = (value: string) => {
    if (!value) return 'No follow-up scheduled'

    // Prevent timezone shift for plain YYYY-MM-DD values.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString()
    }

    return new Date(value).toLocaleDateString()
  }

  useEffect(() => {
    setIsClient(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      // Load today's appointments
      const appointmentsRes = await receptionApi.getAppointments(undefined, undefined, today)
      const allAppointmentsRes = await receptionApi.getAppointments(undefined, undefined, undefined, undefined, 1, 1000)
      let nextVisitDate = 'No follow-up scheduled'

      if (allAppointmentsRes.success && allAppointmentsRes.data && Array.isArray(allAppointmentsRes.data)) {
        const followUps = allAppointmentsRes.data
          .map((a: any) => a.nextVisitDate || a.opdConsultation?.nextVisit)
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())

        if (followUps.length > 0) {
          nextVisitDate = formatDisplayDate(followUps[0])
        }
      }
      
      if (appointmentsRes.success && appointmentsRes.data) {
        const appointments = appointmentsRes.data
        setTodayAppointments(appointments)
        setTodayPage(1)
        setActivityPage(1)
        
        // Calculate stats
        const checkedIn = appointments.filter((a: any) => a.status === 'arrived').length
        const waiting = appointments.filter((a: any) => a.status === 'scheduled').length
        const completed = appointments.filter((a: any) => a.status === 'completed').length
        
        setStats({
          todayAppointments: appointments.length,
          checkedInCount: checkedIn,
          waitingCount: waiting,
          completedCount: completed,
          newRegistrations: 0, // Would come from registrations API
          occupancyRate: Math.round((checkedIn + completed) / (appointments.length || 1) * 100),
          totalPatientsToday: appointments.length,
          nextVisitDate,
        })

        const activityData = appointments.slice(0, 3).map((appointment: any, index: number) => ({
          id: appointment._id || `${index}`,
          type: appointment.status === 'arrived' ? 'checkin' : appointment.status === 'completed' ? 'discharge' : 'appointment',
          description: `${appointment.reason || 'Visit'} with ${appointment.doctorName || 'doctor'}`,
           time: appointment.timeSlot || new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          patientName: appointment.patientName,
        }))

        setRecentActivities(activityData)
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <UserPlus className="h-4 w-4 text-emerald-600" />
      case 'checkin':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'appointment':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'discharge':
        return <Activity className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'arrived':
        return <Badge className="bg-emerald-100 text-emerald-800">Checked-in</Badge>
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (!isClient || isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const todayTotalPages = Math.max(1, Math.ceil(todayAppointments.length / TODAY_PAGE_SIZE))
  const paginatedTodayAppointments = todayAppointments.slice(
    (todayPage - 1) * TODAY_PAGE_SIZE,
    todayPage * TODAY_PAGE_SIZE
  )

  const activityTotalPages = Math.max(1, Math.ceil(recentActivities.length / ACTIVITY_PAGE_SIZE))
  const paginatedActivities = recentActivities.slice(
    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
    activityPage * ACTIVITY_PAGE_SIZE
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Reception Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Manage patient check-ins, appointments, and daily operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Today's Appointments
                </CardTitle>
                <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.checkedInCount} checked-in, {stats.completedCount} completed
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Waiting Patients
                </CardTitle>
                <p className="text-3xl font-bold text-yellow-600">{stats.waitingCount}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Need to be seen by doctors
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Occupancy Rate
                </CardTitle>
                <p className="text-3xl font-bold">{stats.occupancyRate}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.checkedInCount + stats.completedCount} / {stats.todayAppointments} seen
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Next Visit Due
                </CardTitle>
                <p className="text-3xl font-bold">{stats.nextVisitDate}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Follow-up set by doctor
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List - Takes 2/3 of space */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Patient appointments for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.length > 0 ? (
                  paginatedTodayAppointments.map((apt) => (
                    <div key={apt._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{apt.patientName}</span>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {apt.timeSlot}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" /> {apt.doctorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {apt.status === 'scheduled' && (
                          <Link href={`/receptionist/check-in`}>
                            <Button size="sm" variant="outline">Check-in</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No appointments scheduled for today</p>
                  </div>
                )}
                {todayAppointments.length > TODAY_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-2">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Takes 1/3 of space */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest operations and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="p-2 rounded-lg bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.patientName}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivities.length > ACTIVITY_PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                      disabled={activityPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {activityPage} of {activityTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((prev) => Math.min(activityTotalPages, prev + 1))}
                      disabled={activityPage === activityTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/receptionist/patient-records?tab=new">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <UserPlus className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">New Registration</h3>
                  <p className="text-sm text-muted-foreground">Register OPD or IPD patient</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/receptionist/appointments?tab=schedule">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Appointment</h3>
                  <p className="text-sm text-muted-foreground">Book new patient appointment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/receptionist/check-in">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Check-in</h3>
                  <p className="text-sm text-muted-foreground">Process patient arrival</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}