'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { receptionApi } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ReceptionistInpatientDailyPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [registrationId, setRegistrationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any | null>(null)

  const loadReport = async () => {
    try {
      setIsLoading(true)
      const response = await receptionApi.getInpatientDailyReport(date, registrationId || undefined)
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setReport(null)
      }
    } catch {
      toast.error('Failed to load inpatient daily report')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Inpatient Daily Report</h1>
        <p className="text-muted-foreground mt-2 text-base">Generate daily IPD report by registration ID and date.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date and optional registration ID.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Registration ID (optional)</label>
            <Input value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} placeholder="Mongo registration _id" />
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total IPD Patients</CardTitle><p className="text-2xl font-bold">{report.totalIPDPatients}</p></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Daily Revenue</CardTitle><p className="text-2xl font-bold">₹{Number(report.totalDailyRevenue || 0).toLocaleString()}</p></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Report Date</CardTitle><p className="text-2xl font-bold">{new Date(report.reportDate).toLocaleDateString()}</p></CardHeader></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient Reports</CardTitle>
              <CardDescription>Daily consultations, investigations, medications, and charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(report.patientReports || []).map((item: any) => (
                <div key={item.registrationId} className="p-4 border rounded-lg">
                  <p className="font-semibold">{item.patientName} ({item.patientId})</p>
                  <p className="text-sm text-muted-foreground">Room {item.roomNumber} / Bed {item.bedNumber} • Consultant: {item.consultantName}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                    <p>Consultations: {item.dailySummary.consultations}</p>
                    <p>Investigations: {item.dailySummary.investigations}</p>
                    <p>Medications: {item.dailySummary.medications}</p>
                    <p>Room: ₹{item.dailySummary.roomCharge}</p>
                    <p>Total: ₹{Number(item.dailySummary.totalDailyCharges || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(report.patientReports || []).length === 0 && <p className="text-sm text-muted-foreground">No report rows found</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
