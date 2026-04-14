'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, User, Phone, Mail, MapPin, Users, Stethoscope, Activity, TrendingUp, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface ReceptionStats {
  totalAppointments: number
  todayAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalDoctors: number
  totalReceptionists: number
}

interface Appointment {
  _id: string
  patientName: string
  doctorName: string
  department: string
  appointmentDate: string
  timeSlot: string
  status: string
  patientPhone?: string
}

export default function AdminReceptionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ReceptionStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const [statsRes, appointmentsRes, doctorsRes] = await Promise.all([
        fetch('/api/admin/reception/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch(`/api/reception/appointments?date=${selectedDate}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/admin/doctors', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ])

      const statsData = await statsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const doctorsData = await doctorsRes.json()

      if (statsData.success) setStats(statsData.data)
      if (appointmentsData.success) setAppointments(appointmentsData.data || [])
      if (doctorsData.success) setDoctors(doctorsData.data || [])
      
    } catch (error) {
      console.error('Error loading reception data:', error)
      toast.error('Failed to load reception data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      arrived: 'bg-emerald-100 text-emerald-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <Badge className={variants[status] || 'bg-gray-100'}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reception Management</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage front desk operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.todayAppointments || 0} today</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Doctors</CardTitle>
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalDoctors || 0}</p>
            <p className="text-xs text-muted-foreground">Active doctors</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {stats?.totalAppointments 
                ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">{stats?.completedAppointments || 0} completed</p>
          </CardHeader>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Filter by Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        />
        <Button variant="outline" onClick={loadData}>Refresh</Button>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>Schedule and status overview</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No appointments scheduled for this date</div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{apt.patientName}</span>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Doctor: {apt.doctorName}</p>
                      <p>Department: {apt.department}</p>
                      <p>Time: {apt.timeSlot}</p>
                      {apt.patientPhone && <p>Phone: {apt.patientPhone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(`Patient: ${apt.patientName} | Doctor: ${apt.doctorName} | Time: ${apt.timeSlot}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctors List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Doctors</CardTitle>
          <CardDescription>Currently available doctors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</p>
                  <p className="text-sm text-muted-foreground">{doctor.specialization || 'General'}</p>
                  <p className="text-xs text-muted-foreground">{doctor.department}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}