import { ReceptionistSidebar } from './sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['receptionist']}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar - Fixed position for all screen sizes */}
        <ReceptionistSidebar />

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
