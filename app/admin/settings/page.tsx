'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/lib/api-client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    hospitalName: 'MediCare Hospital',
    timezone: 'UTC',
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 30,
    labVerificationPasscodes: {
      Pathology: 'LAB2024',
      Cardiology: 'CARDIO2024',
      Radiology: 'RAD2024',
    },
    emailNotifications: true,
    smsAlerts: false,
    inAppNotifications: true,
    maintenanceMode: false,
  })

  useEffect(() => {
    setIsClient(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await adminApi.getSettings()
      if (response.success && response.data) {
        setSettings({
          hospitalName: response.data.hospitalName || 'MediCare Hospital',
          timezone: response.data.timezone || 'UTC',
          twoFactorEnabled: Boolean(response.data.twoFactorEnabled),
          sessionTimeoutMinutes: Number(response.data.sessionTimeoutMinutes || 30),
          labVerificationPasscodes: {
            Pathology: response.data.labVerificationPasscodes?.Pathology || 'LAB2024',
            Cardiology: response.data.labVerificationPasscodes?.Cardiology || 'CARDIO2024',
            Radiology: response.data.labVerificationPasscodes?.Radiology || 'RAD2024',
          },
          emailNotifications: Boolean(response.data.emailNotifications),
          smsAlerts: Boolean(response.data.smsAlerts),
          inAppNotifications: Boolean(response.data.inAppNotifications),
          maintenanceMode: Boolean(response.data.maintenanceMode),
        })
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      const response = await adminApi.updateSettings(settings)
      if (response.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(response.message || 'Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isClient || isLoading) {
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
                  value={settings.hospitalName}
                  onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-sm text-muted-foreground mt-2">This name appears in system-wide headers</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Timezone</h4>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="UTC">UTC</option>
                  <option value="IST">IST</option>
                  <option value="EST">EST</option>
                  <option value="CST">CST</option>
                  <option value="MST">MST</option>
                  <option value="PST">PST</option>
                </select>
              </div>

              <Button onClick={saveSettings} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
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
                <Button variant="outline" size="sm" onClick={() => setSettings({ ...settings, twoFactorEnabled: !settings.twoFactorEnabled })}>
                  {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground mt-1">Auto-logout after inactivity</p>
                </div>
                <input type="number" value={settings.sessionTimeoutMinutes} onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })} placeholder="Minutes" className="w-24 px-3 py-2 border rounded-md bg-background" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Password Policy</h4>
                  <p className="text-sm text-muted-foreground mt-1">Minimum 12 characters with complexity</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Password policy is configured through auth rules')}>Configure</Button>
              </div>

              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">Investigation Verification Passcodes</h4>
                  <p className="text-sm text-muted-foreground mt-1">Used in Admin Investigations - Verification & Approval tab.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Pathology</label>
                    <input
                      type="text"
                      value={settings.labVerificationPasscodes.Pathology}
                      onChange={(e) => setSettings({
                        ...settings,
                        labVerificationPasscodes: {
                          ...settings.labVerificationPasscodes,
                          Pathology: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Cardiology</label>
                    <input
                      type="text"
                      value={settings.labVerificationPasscodes.Cardiology}
                      onChange={(e) => setSettings({
                        ...settings,
                        labVerificationPasscodes: {
                          ...settings.labVerificationPasscodes,
                          Cardiology: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Radiology</label>
                    <input
                      type="text"
                      value={settings.labVerificationPasscodes.Radiology}
                      onChange={(e) => setSettings({
                        ...settings,
                        labVerificationPasscodes: {
                          ...settings.labVerificationPasscodes,
                          Radiology: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Security Settings'}</Button>
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
                <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-semibold text-foreground">SMS Alerts</h4>
                  <p className="text-sm text-muted-foreground mt-1">Critical alerts via SMS</p>
                </div>
                <input type="checkbox" checked={settings.smsAlerts} onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })} className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">In-system Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">Show notifications in app</p>
                </div>
                <input type="checkbox" checked={settings.inAppNotifications} onChange={(e) => setSettings({ ...settings, inAppNotifications: e.target.checked })} className="w-5 h-5" />
              </div>

              <Button onClick={saveSettings} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Notification Settings'}</Button>
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
                <p className="text-base text-muted-foreground">Configured by system settings</p>
                <p className="text-sm text-muted-foreground mt-2">Automatic backup schedule can be managed by admin</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.info('Backup operation is not connected to a backup service yet')}>Backup Now</Button>
                <Button variant="outline" onClick={() => toast.info('Restore operation is not connected to a backup service yet')}>Restore Backup</Button>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-semibold text-foreground mb-2">Maintenance Mode</h4>
                <p className="text-sm text-muted-foreground mb-3">Enable to restrict system access during maintenance</p>
                <Button variant="outline" onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}>
                  {settings.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
