import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface QuickAction {
  label: string
  href: string
  description?: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="border-b border-border/50">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription className="mt-1">Frequently used operations</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-border/50">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="block p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
