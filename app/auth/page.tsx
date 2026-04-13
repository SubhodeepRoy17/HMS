'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { LogIn, UserPlus, Stethoscope, Users, User } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login, register, isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam && ['doctor', 'patient', 'receptionist'].includes(roleParam)) {
      setRole(roleParam)
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardMap: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/dashboard',
        patient: '/patient/dashboard',
        receptionist: '/receptionist/dashboard',
      }
      router.replace(dashboardMap[user.role] || '/dashboard')
    }
  }, [isAuthenticated, user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await login(email, password)
      
      toast.success('Login successful!', {
        description: 'Redirecting to your dashboard...',
      })
      
      setEmail('')
      setPassword('')

      if (response && response.user && response.user.role) {
        const dashboardMap: Record<string, string> = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          patient: '/patient/dashboard',
          receptionist: '/receptionist/dashboard',
        }
        router.replace(dashboardMap[response.user.role])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      toast.error('Login Failed', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!firstName.trim()) {
      setError('First name is required')
      setIsLoading(false)
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      setIsLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const registerPayload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        password,
        confirmPassword,
        phone,
        role,
      }

      if (role === 'doctor') {
        registerPayload.department = department
        registerPayload.specialization = specialization
      }

      await register(registerPayload)
      
      toast.success('Registration successful!', {
        description: 'Your account has been created. Please login.',
      })

      // Clear form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setPhone('')
      setDepartment('')
      setSpecialization('')
      setError('')
      setActiveTab('login')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      toast.error('Registration Failed', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (roleKey: string) => {
    switch (roleKey) {
      case 'doctor':
        return <Stethoscope className="h-4 w-4" />
      case 'patient':
        return <User className="h-4 w-4" />
      case 'receptionist':
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (roleKey: string) => {
    const labels: Record<string, string> = {
      doctor: 'Doctor',
      patient: 'Patient',
      receptionist: 'Receptionist',
    }
    return labels[roleKey] || roleKey
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">MediCare</h1>
          <p className="text-muted-foreground">Hospital Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Select your role to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selection - No Admin visible */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-3">Select Your Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {['doctor', 'patient', 'receptionist'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                      role === r
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    disabled={isLoading}
                  >
                    {getRoleIcon(r)}
                    {getRoleLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Tabs for Login/Register */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4 max-h-96 overflow-y-auto">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="first-name">First Name *</Label>
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last Name *</Label>
                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Role is fixed based on selection, not changeable during registration */}
                  <div>
                    <Label htmlFor="register-role">Role</Label>
                    <div className="w-full px-3 py-2 border border-input rounded-md bg-muted text-foreground">
                      {getRoleLabel(role)}
                    </div>
                  </div>

                  {role === 'doctor' && (
                    <>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <select
                          id="department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          disabled={isLoading}
                        >
                          <option value="">Select Department</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="General Medicine">General Medicine</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Gynecology">Gynecology</option>
                          <option value="Dermatology">Dermatology</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          type="text"
                          placeholder="e.g., Cardiac Surgery"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="register-password">Password *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 6 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Back to Landing */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to Home
              </Link>
            </div>

            {/* Admin Note - Hidden but accessible via URL */}
            <div className="mt-4 text-center text-xs text-muted-foreground">
              <p>Admin access available at /auth?role=admin</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}