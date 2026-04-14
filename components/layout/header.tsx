'use client'

import { Bell, Hospital } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/user-menu'
import { useAuth } from '@/context/auth-context'

export function Header() {
  const { isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-8">
        {/* Left side - Hospital Name */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Hospital className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col gap-0">
            <span className="text-sm font-semibold text-foreground">MediCare Hospital</span>
            <span className="text-xs text-muted-foreground">Management System</span>
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-muted"
            disabled={isLoading}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse" />
          </Button>

          {/* User Menu - Connected to Auth Context */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
