'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { LogIn, Stethoscope, Users, User } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login, isAuthenticated, isLoading: authLoading } = useAuth()

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
      const response = await login(email, password, role as 'doctor' | 'patient' | 'receptionist')

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
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">MediCare</h1>
          <p className="text-muted-foreground">Hospital Management System</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Select your role and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-2">
                {['patient', 'doctor', 'receptionist'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-3 min-h-20 rounded-lg border-2 transition-all text-xs font-medium flex items-center justify-center gap-1 flex-col ${
                      role === r
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    disabled={isLoading}
                  >
                    {getRoleIcon(r)}
                    <span>{getRoleLabel(r)}</span>
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

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>

            {/* Back to Landing */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}