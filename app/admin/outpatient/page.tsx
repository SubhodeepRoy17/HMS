'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Stethoscope, Pill, FileText, Activity, TrendingUp, Clock, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Out Patient Department</h1>
        <p className="text-muted-foreground mt-1">Monitor OPD consultations and prescriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Top Medications */}
      {stats?.topMedications && stats.topMedications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Prescribed Medications</CardTitle>
            <CardDescription>Most frequently prescribed drugs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topMedications.map((med, index) => (
                <div key={med._id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{med._id}</span>
                  </div>
                  <span className="text-muted-foreground">{med.count} prescriptions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Consultations</CardTitle>
          <CardDescription>OPD schedule for {new Date(selectedDate).toLocaleDateString()}</CardDescription>
          <div className="mt-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No consultations scheduled for this date</div>
          ) : (
            <div className="space-y-3">
              {consultations.map((consult) => (
                <div key={consult._id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{consult.patientName}</p>
                    <p className="text-sm text-muted-foreground">Doctor: {consult.doctorName}</p>
                    {consult.diagnosis && <p className="text-sm mt-1">Diagnosis: {consult.diagnosis}</p>}
                  </div>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}