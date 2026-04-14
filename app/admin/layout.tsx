'use client'

import { AdminSidebar } from './sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/admin') {
    return <>{children}</>
  }

  return (
    <ProtectedRoute requiredRoles={['admin']} loginPath="/admin">
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar - Fixed position for all screen sizes */}
        <AdminSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main content - scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
