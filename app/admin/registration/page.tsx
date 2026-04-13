'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Users, Calendar, Activity, Search, Eye, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface RegistrationStats {
  totalPatients: number
  todayRegistrations: number
  monthlyRegistrations: number
  opdPatients: number
  ipdPatients: number
}

interface PatientRegistration {
  _id: string
  patientId: string
  registrationNumber: string
  patientType: 'OPD' | 'IPD'
  demographics: {
    fullName: string
    age: number
    sex: string
    phone: string
  }
  department: string
  consultantName: string
  registrationDate: string
}

export default function AdminRegistrationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<RegistrationStats | null>(null)
  const [recentRegistrations, setRecentRegistrations] = useState<PatientRegistration[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const [statsRes, registrationsRes] = await Promise.all([
        fetch('/api/admin/registration/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/reception/patients?limit=10', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ])

      const statsData = await statsRes.json()
      const registrationsData = await registrationsRes.json()

      if (statsData.success) setStats(statsData.data)
      if (registrationsData.success) setRecentRegistrations(registrationsData.data || [])
      
    } catch (error) {
      console.error('Error loading registration data:', error)
      toast.error('Failed to load registration data')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRegistrations = recentRegistrations.filter(reg =>
    reg.demographics.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold">Patient Registration</h1>
        <p className="text-muted-foreground mt-1">Monitor patient registrations and demographics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.monthlyRegistrations || 0}</p>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.todayRegistrations || 0}</p>
            <p className="text-xs text-muted-foreground">Registered today</p>
          </CardHeader>
        </Card>
      </div>

      {/* Patient Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Patient Distribution</CardTitle>
            <CardDescription>OPD vs IPD patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>OPD Patients</span>
                <span className="font-bold">{stats?.opdPatients || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 rounded-full h-2" 
                  style={{ width: `${stats?.totalPatients ? ((stats.opdPatients / stats.totalPatients) * 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <span>IPD Patients</span>
                <span className="font-bold">{stats?.ipdPatients || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 rounded-full h-2" 
                  style={{ width: `${stats?.totalPatients ? ((stats.ipdPatients / stats.totalPatients) * 100) : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common registration tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" /> Register New OPD Patient
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" /> Admit New IPD Patient
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Search Patient Records
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Latest patient registrations</CardDescription>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations found</div>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((reg) => (
                <div key={reg._id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{reg.demographics.fullName}</span>
                      <Badge variant={reg.patientType === 'OPD' ? 'default' : 'secondary'}>
                        {reg.patientType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>ID: {reg.patientId} | Reg No: {reg.registrationNumber}</p>
                      <p>Age: {reg.demographics.age} | Gender: {reg.demographics.sex}</p>
                      <p>Department: {reg.department} | Doctor: {reg.consultantName}</p>
                      <p>Registered: {new Date(reg.registrationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}