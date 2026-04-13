'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Lock, Bell, Database } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-2 text-base">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b border-border pb-4">
                <h4 className="font-semibold text-foreground mb-2">Hospital Name</h4>
                <input
                  type="text"
                  defaultValue="MediCare Hospital"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-sm text-muted-foreground mt-2">This name appears in system-wide headers</p>
              </div>

              <div className="border-b border-border pb-4">
                <h4 className="font-semibold text-foreground mb-2">System Logo</h4>
                <input
                  type="file"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-sm text-muted-foreground mt-2">Upload hospital logo (PNG, JPG - Max 2MB)</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Timezone</h4>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option>UTC</option>
                  <option>Est</option>
                  <option>CST</option>
                  <option>MST</option>
                  <option>PST</option>
                </select>
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security policies and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground mt-1">Require 2FA for all users</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground mt-1">Auto-logout after inactivity</p>
                </div>
                <input type="number" defaultValue="30" placeholder="Minutes" className="w-24 px-3 py-2 border rounded-md bg-background" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Password Policy</h4>
                  <p className="text-sm text-muted-foreground mt-1">Minimum 12 characters with complexity</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <Button>Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">Send alerts via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">SMS Alerts</h4>
                  <p className="text-sm text-muted-foreground mt-1">Critical alerts via SMS</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">In-system Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">Show notifications in app</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Maintenance</CardTitle>
              <CardDescription>Manage system backups and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b border-border pb-4">
                <h4 className="font-semibold text-foreground mb-2">Last Backup</h4>
                <p className="text-base text-muted-foreground">2024-03-27 02:30 AM</p>
                <p className="text-sm text-muted-foreground mt-2">Automatic daily backups at 2:00 AM</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Backup Now</Button>
                <Button variant="outline">Restore Backup</Button>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-semibold text-foreground mb-2">Maintenance Mode</h4>
                <p className="text-sm text-muted-foreground mb-3">Enable to restrict system access during maintenance</p>
                <Button variant="outline">Enable Maintenance Mode</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
