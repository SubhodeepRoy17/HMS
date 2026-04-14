'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Stethoscope, Pill, FileText, Clock, CalendarRange } from 'lucide-react'
import { toast } from 'sonner'

interface OutpatientStats {
  totalConsultations: number
  todayConsultations: number
  activePrescriptions: number
  totalPrescriptions: number
  topMedications: Array<{ _id: string; count: number }>
}

interface Consultation {
  _id: string
  patientName: string
  doctorName: string
  diagnosis: string
  consultationDate: string
  status: string
}

export default function AdminOutpatientPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<OutpatientStats | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const [statsRes, consultationsRes] = await Promise.all([
        fetch('/api/admin/outpatient/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch(`/api/doctor/appointments?date=${selectedDate}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ])

      const statsData = await statsRes.json()
      const consultationsData = await consultationsRes.json()

      if (statsData.success) setStats(statsData.data)
      if (consultationsData.success) setConsultations(consultationsData.data || [])
      
    } catch (error) {
      console.error('Error loading outpatient data:', error)
      toast.error('Failed to load outpatient data')
    } finally {
      setIsLoading(false)
    }
  }

  const getConsultationStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase?.() || 'pending'
    const classMap: Record<string, string> = {
      scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
      in_progress: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    }

    return (
      <Badge className={classMap[normalized] || classMap.pending}>
        {normalized.replace('_', ' ')}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Skeleton className="h-[420px] xl:col-span-2" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Out Patient Department</h1>
          <p className="text-muted-foreground mt-1">Daily consultation overview, prescription trends, and OPD status.</p>
        </div>
        <div className="w-full lg:w-auto rounded-lg border bg-card p-3">
          <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
            <CalendarRange className="h-4 w-4" /> Consultation Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full lg:w-52 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalConsultations || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Today's OPD</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.todayConsultations || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Pill className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.activePrescriptions || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalPrescriptions || 0}</p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="xl:col-span-2">
            <CardTitle>Consultation Queue</CardTitle>
            <CardDescription>OPD schedule for {new Date(selectedDate).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No consultations scheduled for this date</div>
            ) : (
              <div className="space-y-3">
                {consultations.map((consult) => (
                  <div key={consult._id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold truncate">{consult.patientName}</p>
                        <p className="text-sm text-muted-foreground">Doctor: {consult.doctorName}</p>
                        {consult.diagnosis ? (
                          <p className="text-sm line-clamp-2">Diagnosis: {consult.diagnosis}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Diagnosis pending</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getConsultationStatusBadge(consult.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Prescribed Medications</CardTitle>
            <CardDescription>Most frequently used medicines</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topMedications && stats.topMedications.length > 0 ? (
              <div className="space-y-3">
                {stats.topMedications.map((med, index) => (
                  <div key={med._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="font-medium truncate">{med._id}</span>
                    </div>
                    <span className="text-muted-foreground text-sm shrink-0">{med.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">No prescription trend data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}