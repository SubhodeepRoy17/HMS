'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, FileText, Activity, CheckCircle2, 
  Pill, Microscope, Stethoscope, Clock, Heart, 
  Syringe, ArrowRight, Download 
} from 'lucide-react'
import { patientApi } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardStats {
  upcomingAppointments: number
  completedAppointments: number
  activePrescriptions: number
  completedTests: number
  pendingTests: number
  lastVisit: string
  nextAppointment: string
}

interface UpcomingAppointment {
  _id: string
  appointmentId?: string
  doctorName: string
  department: string
  appointmentDate: string  // FIXED: changed from 'date' to 'appointmentDate'
  timeSlot: string
  reason: string
  status: string
}

interface RecentPrescription {
  _id: string
  medication: string
  dosage: string
  frequency: string
  prescribedDate: string
  doctorName: string
}

interface RecentLabResult {
  _id: string
  testName: string
  date: string
  status: string
  isAbnormal?: boolean
}

interface HealthTip {
  id: number
  title: string
  description: string
  icon: any
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    completedAppointments: 0,
    activePrescriptions: 0,
    completedTests: 0,
    pendingTests: 0,
    lastVisit: 'No visits yet',
    nextAppointment: 'No upcoming appointments',
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([])
  const [recentLabResults, setRecentLabResults] = useState<RecentLabResult[]>([])
  const [showHealthTips, setShowHealthTips] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load appointments
      const appointmentsRes = await patientApi.getMyAppointments()
      let upcoming: UpcomingAppointment[] = []
      let completed = 0
      let nextVisitDate = 'No follow-up scheduled'
      
      if (appointmentsRes.success && appointmentsRes.data && Array.isArray(appointmentsRes.data)) {
        upcoming = appointmentsRes.data.filter((a: any) => a.status === 'scheduled')
        completed = appointmentsRes.data.filter((a: any) => a.status === 'completed').length
        setUpcomingAppointments(upcoming.slice(0, 3))

        const followUps = appointmentsRes.data
          .map((a: any) => a.nextVisitDate || a.opdConsultation?.nextVisit)
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())

        if (followUps.length > 0) {
          nextVisitDate = new Date(followUps[0]).toLocaleDateString()
        } else if (upcoming.length > 0) {
          nextVisitDate = new Date(upcoming[0].appointmentDate).toLocaleDateString()
        }
      }
      
      // Load prescriptions
      let activePrescriptions = 0
      let recentPresc: RecentPrescription[] = []
      
      try {
        const historyRes = await patientApi.getMedicalHistory()
        const prescriptions = (historyRes.success && historyRes.data && (historyRes.data as any).prescriptions) || []
        if (Array.isArray(prescriptions)) {
          activePrescriptions = prescriptions.filter((p: any) => p.status === 'active').length
          recentPresc = prescriptions.slice(0, 2).map((p: any) => ({
            _id: p._id,
            medication: p.medication,
            dosage: p.dosage,
            frequency: p.frequency || 'As prescribed',
            prescribedDate: p.createdAt || new Date().toISOString(),
            doctorName: p.doctorName || 'Doctor'
          }))
          setRecentPrescriptions(recentPresc)
        }
      } catch (err) {
        console.log('No prescriptions found')
      }
      
      // Load lab results
      let completedTests = 0
      let pendingTests = 0
      let recentLab: RecentLabResult[] = []
      
      try {
        const labRes = await patientApi.getLabResults()
        if (labRes.success && labRes.data && Array.isArray(labRes.data)) {
          completedTests = labRes.data.filter((l: any) => l.status === 'completed' || l.status === 'verified').length
          pendingTests = labRes.data.filter((l: any) => l.status === 'pending' || l.status === 'in-progress').length
          recentLab = labRes.data.slice(0, 2).map((l: any) => ({
            _id: l._id,
            testName: l.testName || 'Lab Test',
            date: l.date || l.requisitionDate || l.createdAt,
            status: l.status,
            isAbnormal: l.parameters?.some((p: any) => p.isAbnormal)
          }))
          setRecentLabResults(recentLab)
        }
      } catch (err) {
        console.log('No lab results found')
      }
      
      setStats({
        upcomingAppointments: upcoming.length,
        completedAppointments: completed,
        activePrescriptions,
        completedTests,
        pendingTests,
        lastVisit: completed > 0 ? 'Recent visit' : 'No visits yet',
        nextAppointment: nextVisitDate,
      })
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const healthTips: HealthTip[] = [
    {
      id: 1,
      title: 'Stay Hydrated',
      description: 'Drink at least 8 glasses of water daily for optimal health.',
      icon: Activity
    },
    {
      id: 2,
      title: 'Take Medications on Time',
      description: 'Set reminders for your medications to maintain consistent treatment.',
      icon: Pill
    },
    {
      id: 3,
      title: 'Regular Exercise',
      description: '30 minutes of moderate exercise can improve heart health.',
      icon: Heart
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
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
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'Patient'}!
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Your health dashboard - manage appointments, view reports, and track medications
          </p>
          {user?.patientId && (
            <p className="text-sm text-muted-foreground mt-1">
              Patient ID: {user.patientId}
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last login: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Next Visit
                </CardTitle>
                <p className="text-3xl font-bold">{stats.nextAppointment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Upcoming appointments: {stats.upcomingAppointments}
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
                  Active Prescriptions
                </CardTitle>
                <p className="text-3xl font-bold">{stats.activePrescriptions}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Current medications
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Lab Results
                </CardTitle>
                <p className="text-3xl font-bold">{stats.completedTests}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingTests} pending
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Microscope className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                  Completed Visits
                </CardTitle>
                <p className="text-3xl font-bold">{stats.completedAppointments}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last: {stats.lastVisit}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </div>
              <Link href="/patient/appointments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{apt.doctorName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{apt.department}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.timeSlot}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{apt.reason}</p>
                    </div>
                    <Link href="/patient/appointments">
                      <Button size="sm" variant="outline">Details</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Link href="/patient/appointments">
                    <Button className="mt-4">View Appointment History</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Lab Results */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Lab Results</CardTitle>
                <CardDescription>Latest test reports</CardDescription>
              </div>
              <Link href="/patient/lab-results">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLabResults.length > 0 ? (
                recentLabResults.map((lab) => (
                  <div key={lab._id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Microscope className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{lab.testName}</span>
                      </div>
                      {lab.status === 'completed' ? (
                        lab.isAbnormal ? (
                          <Badge className="bg-red-100 text-red-800">Abnormal</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Normal</Badge>
                        )
                      ) : (
                        getStatusBadge(lab.status)
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lab.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No lab results available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Tips */}
          {showHealthTips && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Health Tips</CardTitle>
                  <CardDescription>For your well-being</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHealthTips(false)}
                >
                  Hide
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthTips.map((tip) => {
                  const Icon = tip.icon
                  return (
                    <div key={tip.id} className="flex gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 h-fit">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{tip.title}</h4>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Health Summary Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Health Summary</h3>
                <p className="text-sm text-muted-foreground">
                  You have {stats.activePrescriptions} active prescriptions and {stats.upcomingAppointments} upcoming appointments
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/patient/medical-history">
                <Button variant="outline">View Full History</Button>
              </Link>
              <Link href="/patient/appointments">
                <Button>Book Appointment</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}