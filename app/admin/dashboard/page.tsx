'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Users, BarChart3, Settings, AlertCircle, CheckCircle2, Activity, TrendingUp, Plus, Stethoscope, UserCheck, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalReceptionists: number
  totalAppointments: number
  pendingAppointments: number
  completedAppointments: number
  totalRevenue: number
  pendingBills: number
  newUsersThisMonth: number
  activePrescriptions: number
  todayAppointments: number
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  department?: string
  specialization?: string
  isActive: boolean
  lastLogin?: string
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [doctors, setDoctors] = useState<User[]>([])
  const [receptionists, setReceptionists] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'receptionist',
    department: '',
    specialization: '',
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsRes, doctorsRes, receptionistsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getUsers('doctor'),
        adminApi.getUsers('receptionist'),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      } else {
        console.error('Stats error:', statsRes)
      }

      if (doctorsRes.success && doctorsRes.data) {
        setDoctors(doctorsRes.data)
      }

      if (receptionistsRes.success && receptionistsRes.data) {
        setReceptionists(receptionistsRes.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(message)
      toast.error('Dashboard Error', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.phone || !addUserForm.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (addUserForm.password !== addUserForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (addUserForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (addUserForm.role === 'doctor' && (!addUserForm.department || !addUserForm.specialization)) {
      toast.error('Department and Specialization are required for doctors')
      return
    }

    try {
      const response = await adminApi.createStaffUser({
        firstName: addUserForm.firstName,
        lastName: addUserForm.lastName,
        email: addUserForm.email,
        phone: addUserForm.phone,
        password: addUserForm.password,
        confirmPassword: addUserForm.confirmPassword,
        role: addUserForm.role,
        department: addUserForm.role === 'doctor' ? addUserForm.department : undefined,
        specialization: addUserForm.role === 'doctor' ? addUserForm.specialization : undefined,
      })

      if (response.success) {
        toast.success('User added successfully')
        setIsDialogOpen(false)
        setAddUserForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'receptionist',
          department: '',
          specialization: '',
        })
        loadDashboardData()
      } else {
        throw new Error(response.message || 'Failed to add user')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add user'
      toast.error(message)
    }
  }

  const getMetrics = () => {
    if (!stats) return []

    return [
      {
        label: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        change: `+${stats.newUsersThisMonth} this month`,
        icon: Users,
        color: 'text-blue-600',
      },
      {
        label: 'Doctors',
        value: stats.totalDoctors.toString(),
        change: `${stats.totalPatients} patients`,
        icon: Stethoscope,
        color: 'text-emerald-600',
      },
      {
        label: 'Today\'s Appointments',
        value: stats.todayAppointments.toString(),
        change: `${stats.pendingAppointments} pending`,
        icon: Activity,
        color: 'text-amber-600',
      },
      {
        label: 'Total Revenue',
        value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`,
        change: `${stats.pendingBills} pending bills`,
        icon: TrendingUp,
        color: 'text-purple-600',
      },
    ]
  }

  const getUserDistributionData = () => {
    if (!stats) return []
    return [
      { name: 'Doctors', value: stats.totalDoctors, color: '#3b82f6' },
      { name: 'Patients', value: stats.totalPatients, color: '#10b981' },
      { name: 'Receptionists', value: stats.totalReceptionists, color: '#f59e0b' },
    ]
  }

  const getAppointmentData = () => {
    if (!stats) return []
    return [
      { name: 'Pending', value: stats.pendingAppointments, fill: '#ef4444' },
      { name: 'Completed', value: stats.completedAppointments, fill: '#10b981' },
      { name: 'Today', value: stats.todayAppointments, fill: '#3b82f6' },
    ]
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button onClick={loadDashboardData} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const metrics = getMetrics()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Administrator Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base">
          System-wide statistics and management
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="overflow-hidden hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">
                      {metric.label}
                    </CardTitle>
                    <p className="text-3xl font-bold text-foreground">
                      {metric.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{metric.change}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getUserDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {getUserDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Status</CardTitle>
              <CardDescription>Overview of appointment states</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAppointmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {getAppointmentData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Tabs */}
      <Tabs defaultValue="doctors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Doctors ({doctors.length})
          </TabsTrigger>
          <TabsTrigger value="receptionists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Receptionists ({receptionists.length})
          </TabsTrigger>
        </TabsList>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Doctors Management</h3>
            <Dialog open={isDialogOpen && addUserForm.role === 'doctor'} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (open) setAddUserForm({ ...addUserForm, role: 'doctor' })
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>Create a new doctor account</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="First Name" value={addUserForm.firstName} onChange={(e) => setAddUserForm({...addUserForm, firstName: e.target.value})} required />
                    <Input placeholder="Last Name" value={addUserForm.lastName} onChange={(e) => setAddUserForm({...addUserForm, lastName: e.target.value})} required />
                  </div>
                  <Input type="email" placeholder="Email" value={addUserForm.email} onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})} required />
                  <Input placeholder="Phone" value={addUserForm.phone} onChange={(e) => setAddUserForm({...addUserForm, phone: e.target.value})} required />
                  <Input placeholder="Department" value={addUserForm.department} onChange={(e) => setAddUserForm({...addUserForm, department: e.target.value})} required />
                  <Input placeholder="Specialization" value={addUserForm.specialization} onChange={(e) => setAddUserForm({...addUserForm, specialization: e.target.value})} required />
                  <Input type="password" placeholder="Password" value={addUserForm.password} onChange={(e) => setAddUserForm({...addUserForm, password: e.target.value})} required />
                  <Input type="password" placeholder="Confirm Password" value={addUserForm.confirmPassword} onChange={(e) => setAddUserForm({...addUserForm, confirmPassword: e.target.value})} required />
                  <Button type="submit" className="w-full">Add Doctor</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <Card key={doctor._id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-muted-foreground">{doctor.email} • {doctor.phone}</p>
                    <p className="text-sm">{doctor.specialization} • {doctor.department}</p>
                  </div>
                  <Badge className={doctor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {doctors.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No doctors found</CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* Receptionists Tab */}
        <TabsContent value="receptionists" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Receptionists Management</h3>
            <Dialog open={isDialogOpen && addUserForm.role === 'receptionist'} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (open) setAddUserForm({ ...addUserForm, role: 'receptionist', department: '', specialization: '' })
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Receptionist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Receptionist</DialogTitle>
                  <DialogDescription>Create a new receptionist account</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="First Name" value={addUserForm.firstName} onChange={(e) => setAddUserForm({...addUserForm, firstName: e.target.value})} required />
                    <Input placeholder="Last Name" value={addUserForm.lastName} onChange={(e) => setAddUserForm({...addUserForm, lastName: e.target.value})} required />
                  </div>
                  <Input type="email" placeholder="Email" value={addUserForm.email} onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})} required />
                  <Input placeholder="Phone" value={addUserForm.phone} onChange={(e) => setAddUserForm({...addUserForm, phone: e.target.value})} required />
                  <Input type="password" placeholder="Password" value={addUserForm.password} onChange={(e) => setAddUserForm({...addUserForm, password: e.target.value})} required />
                  <Input type="password" placeholder="Confirm Password" value={addUserForm.confirmPassword} onChange={(e) => setAddUserForm({...addUserForm, confirmPassword: e.target.value})} required />
                  <Button type="submit" className="w-full">Add Receptionist</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {receptionists.map((receptionist) => (
              <Card key={receptionist._id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{receptionist.firstName} {receptionist.lastName}</p>
                    <p className="text-sm text-muted-foreground">{receptionist.email} • {receptionist.phone}</p>
                  </div>
                  <Badge className={receptionist.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}>
                    {receptionist.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {receptionists.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No receptionists found</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}