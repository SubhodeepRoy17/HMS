import { Sidebar } from './sidebar'
import { Header } from './header'

interface MainLayoutProps {
  children: React.ReactNode
  role?: 'admin' | 'doctor' | 'patient' | 'receptionist'
}

export function MainLayout({ children, role = 'admin' }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Fixed position for all screen sizes */}
      <Sidebar role={role} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
