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
}

interface RecentActivity {
  id: string
  type: 'registration' | 'checkin' | 'appointment' | 'discharge'
  description: string
  time: string
  patientName: string
}

export default function ReceptionistDashboard() {
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
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])

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
      
      if (appointmentsRes.success && appointmentsRes.data) {
        const appointments = appointmentsRes.data
        setTodayAppointments(appointments)
        
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
        })
      }
      
      // Load recent activities (would come from activity API)
      setRecentActivities([
        {
          id: '1',
          type: 'checkin',
          description: 'Checked in for Cardiology consultation',
          time: '10:30 AM',
          patientName: 'John Doe',
        },
        {
          id: '2',
          type: 'registration',
          description: 'New OPD registration completed',
          time: '10:15 AM',
          patientName: 'Sarah Wilson',
        },
        {
          id: '3',
          type: 'appointment',
          description: 'Scheduled follow-up appointment',
          time: '09:45 AM',
          patientName: 'Robert Brown',
        },
      ])
      
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
                  New Registrations
                </CardTitle>
                <p className="text-3xl font-bold">{stats.newRegistrations}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Today's new patients
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
                  todayAppointments.slice(0, 5).map((apt) => (
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
                {todayAppointments.length > 5 && (
                  <Link href="/receptionist/appointments">
                    <Button variant="outline" className="w-full mt-2">
                      View All ({todayAppointments.length}) Appointments
                    </Button>
                  </Link>
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
                {recentActivities.map((activity) => (
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