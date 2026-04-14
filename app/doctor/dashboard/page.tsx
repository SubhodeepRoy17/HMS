'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, Calendar, ClipboardList, AlertCircle, CheckCircle2, 
  Clock, TrendingUp, Stethoscope, FileText, Pill, Activity,
  Loader2, ArrowRight, Search, UserPlus, Brain, Heart
} from 'lucide-react'
import { doctorApi, receptionApi } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardStats {
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  totalPatients: number
  activePrescriptions: number
  pendingReports: number
}

interface Appointment {
  _id: string
  patientName: string
  patientId: string
  appointmentDate: string
  timeSlot: string
  reason: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
}

interface RecentPatient {
  _id: string
  name: string
  lastVisit: string
  condition: string
}

interface PrescriptionSummary {
  _id: string
  patientName: string
  medication: string
  dosage: string
  createdAt: string
  status: string
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    activePrescriptions: 0,
    pendingReports: 0,
  })
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<PrescriptionSummary[]>([])
  const [showCheckInList, setShowCheckInList] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Load today's appointments
      const appointmentsRes = await doctorApi.getAppointments()
      let todayApps: Appointment[] = []
      let upcoming = 0
      let completed = 0
      
      if (appointmentsRes.success && appointmentsRes.data) {
        todayApps = appointmentsRes.data.filter((a: any) => 
          new Date(a.appointmentDate).toISOString().split('T')[0] === today
        )
        upcoming = appointmentsRes.data.filter((a: any) => 
          a.status === 'scheduled' && new Date(a.appointmentDate) > new Date()
        ).length
        completed = appointmentsRes.data.filter((a: any) => a.status === 'completed').length
        setTodayAppointments(todayApps.slice(0, 5))
      }
      
      // Load prescriptions
      const prescriptionsRes = await doctorApi.getPrescriptions()
      let activePrescriptions = 0
      let recentPresc: PrescriptionSummary[] = []
      
      if (prescriptionsRes.success && prescriptionsRes.data) {
        activePrescriptions = prescriptionsRes.data.filter((p: any) => p.status === 'active').length
        recentPresc = prescriptionsRes.data.slice(0, 3).map((p: any) => ({
          _id: p._id,
          patientName: p.patientName,
          medication: p.medication,
          dosage: p.dosage,
          createdAt: p.createdAt,
          status: p.status
        }))
        setRecentPrescriptions(recentPresc)
      }
      
      // Get dashboard summary from API
      const summaryRes = await doctorApi.getDashboardSummary()
      let totalPatients = 0
      
      if (summaryRes.success && summaryRes.data) {
        totalPatients = summaryRes.data.statistics?.totalPatients || 0
      }
      
      setStats({
        todayAppointments: todayApps.length,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        totalPatients,
        activePrescriptions,
        pendingReports: 0,
      })
      
      const recentFromAppointments = new Map<string, RecentPatient>()
      if (appointmentsRes.success && appointmentsRes.data) {
        appointmentsRes.data.forEach((a: any) => {
          if (!recentFromAppointments.has(a.patientId)) {
            recentFromAppointments.set(a.patientId, {
              _id: a.patientId,
              name: a.patientName,
              lastVisit: a.appointmentDate,
              condition: a.reason || 'Consultation',
            })
          }
        })
      }
      setRecentPatients(Array.from(recentFromAppointments.values()).slice(0, 3))
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const response = await doctorApi.updateAppointment(appointmentId, { status: 'in-progress' })
      if (response.success) {
        toast.success('Consultation started')
        loadDashboardData()
      } else {
        toast.error('Failed to start consultation')
      }
    } catch (error) {
      console.error('Error starting consultation:', error)
      toast.error('Failed to start consultation')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Waiting</Badge>
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome, Dr. {user?.firstName || 'Doctor'}!
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Manage your patients, appointments, and prescriptions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Today's Appointments
                </CardTitle>
                <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Scheduled for today
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Total Patients
                </CardTitle>
                <p className="text-3xl font-bold">{stats.totalPatients}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Under your care
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Active Prescriptions
                </CardTitle>
                <p className="text-3xl font-bold">{stats.activePrescriptions}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Current medications
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Pill className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Completion Rate
                </CardTitle>
                <p className="text-3xl font-bold">
                  {stats.todayAppointments > 0 
                    ? Math.round((stats.completedAppointments / stats.todayAppointments) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completedAppointments} completed today
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments - Takes 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </div>
              <Link href="/doctor/appointments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{apt.patientName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {apt.timeSlot}
                        </span>
                        <span>ID: {apt.patientId}</span>
                      </div>
                      <p className="text-sm mt-2"><strong>Reason:</strong> {apt.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      {apt.status === 'scheduled' && (
                        <Button size="sm" onClick={() => handleStartConsultation(apt._id)}>
                          Start Consultation
                        </Button>
                      )}
                      {apt.status === 'in-progress' && (
                        <Link href={`/doctor/medical-records?patient=${apt.patientId}`}>
                          <Button size="sm">View Records</Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info(`Patient: ${apt.patientName} | Reason: ${apt.reason} | Time: ${apt.timeSlot}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Patients */}
        <div className="space-y-6">
          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Patients you've recently seen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{patient.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.condition}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/doctor/medical-records?patient=${patient._id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Prescriptions - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>Latest medications prescribed</CardDescription>
          </div>
          <Link href="/doctor/prescriptions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPrescriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentPrescriptions.map((presc) => (
                <div key={presc._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{presc.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {presc.medication} - {presc.dosage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(presc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={presc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}>
                    {presc.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No prescriptions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}