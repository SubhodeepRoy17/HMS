'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  FileText,
  Heart,
  Menu,
  Stethoscope,
  Users,
  X,
  Home,
  Calendar,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigationByRole: Record<string, NavigationItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Reception', href: '/reception', icon: Users },
    { label: 'Patient Registration', href: '/registration', icon: Heart },
    { label: 'Out Patient Dept', href: '/outpatient', icon: FileText },
    { label: 'OPD Billing', href: '/billing', icon: BarChart3 },
    { label: 'Investigations', href: '/investigations', icon: ClipboardList },
    { label: 'System Settings', href: '#', icon: Settings },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: Home },
    { label: 'Appointments', href: '#', icon: Calendar },
    { label: 'Medical Records', href: '#', icon: FileText },
    { label: 'Prescriptions', href: '#', icon: ClipboardList },
  ],
  patient: [
    { label: 'Dashboard', href: '/patient/dashboard', icon: Home },
    { label: 'Appointments', href: '#', icon: Calendar },
    { label: 'Lab Results', href: '#', icon: FileText },
    { label: 'Medical History', href: '#', icon: ClipboardList },
  ],
  receptionist: [
    { label: 'Dashboard', href: '/reception', icon: Home },
    { label: 'Check-in', href: '/reception', icon: Users },
    { label: 'Appointments', href: '#', icon: Calendar },
    { label: 'Patient Records', href: '/registration', icon: FileText },
  ],
}

interface RoleSidebarProps {
  role: 'admin' | 'doctor' | 'patient' | 'receptionist'
}

export function RoleSidebar({ role }: RoleSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const navigationItems = navigationByRole[role] || []

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

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 z-40 flex flex-col',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent">
              <Stethoscope className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">MediCare</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
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

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <p className="text-xs text-sidebar-foreground/60">
            Hospital Management System v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
