'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, FileText, Heart, Menu, Users, X, Settings, LogOut, Stethoscope, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigationByRole = {
  admin: [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: Activity,
    },
    {
      label: 'Reception',
      href: '/reception',
      icon: Users,
    },
    {
      label: 'Patient Registration',
      href: '/registration',
      icon: Heart,
    },
    {
      label: 'Out Patient Dept',
      href: '/outpatient',
      icon: FileText,
    },
    {
      label: 'OPD Billing',
      href: '/billing',
      icon: BarChart3,
    },
    {
      label: 'Investigations',
      href: '/investigations',
      icon: Activity,
    },
  ],
  doctor: [
    {
      label: 'Dashboard',
      href: '/doctor/dashboard',
      icon: Activity,
    },
    {
      label: 'My Appointments',
      href: '/doctor/appointments',
      icon: Calendar,
    },
    {
      label: 'Patient Records',
      href: '/doctor/patients',
      icon: Users,
    },
    {
      label: 'Prescriptions',
      href: '/doctor/prescriptions',
      icon: FileText,
    },
  ],
  patient: [
    {
      label: 'Dashboard',
      href: '/patient/dashboard',
      icon: Activity,
    },
    {
      label: 'My Appointments',
      href: '/patient/appointments',
      icon: Calendar,
    },
    {
      label: 'Medical History',
      href: '/patient/medical-history',
      icon: FileText,
    },
    {
      label: 'Lab Results',
      href: '/patient/lab-results',
      icon: BarChart3,
    },
  ],
  receptionist: [
    {
      label: 'Check-in',
      href: '/reception',
      icon: Users,
    },
    {
      label: 'Patient Registration',
      href: '/registration',
      icon: Heart,
    },
    {
      label: 'Appointments',
      href: '/outpatient',
      icon: Calendar,
    },
    {
      label: 'Billing',
      href: '/billing',
      icon: BarChart3,
    },
  ],
}

interface SidebarProps {
  role?: 'admin' | 'doctor' | 'patient' | 'receptionist'
}

export function Sidebar({ role = 'admin' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar hover:bg-sidebar/80 text-sidebar-foreground"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position on all screen sizes */}
      <aside
        className={cn(
          'fixed md:relative left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 z-40 flex flex-col',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-accent" />
            <h1 className="font-bold text-lg hidden sm:inline">HMS</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationByRole[role].map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 text-base h-10 rounded-lg transition-all',
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-lg'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-sidebar-border mt-auto space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = '/'
            }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
          <p className="text-xs text-sidebar-foreground/60 text-center">
            v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
