import { ReceptionistSidebar } from './sidebar'
import { Header } from '@/components/layout/header'

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Fixed position for all screen sizes */}
      <ReceptionistSidebar />
      
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
