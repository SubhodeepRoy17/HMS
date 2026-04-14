'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

export default function ReceptionistDoctorSchedulesPage() {
  // Initialize with today's date
  const getTodayDate = () => new Date().toISOString().split('T')[0]
  
  const [department, setDepartment] = useState('General Medicine')
  const [doctorId, setDoctorId] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [date, setDate] = useState<string>(getTodayDate())
  const [doctorType, setDoctorType] = useState('General')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])

  // Initialize date on component mount
  useEffect(() => {
    setDate(getTodayDate())
  }, [])

  const slotsPreview = useMemo(() => {
    if (!startTime || !endTime) return [] as { startTime: string; endTime: string }[]
    const result: { startTime: string; endTime: string }[] = []

    const toMinutes = (value: string) => {
      const [h, m] = value.split(':').map(Number)
      return h * 60 + m
    }
    const toTime = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0')
      const m = (mins % 60).toString().padStart(2, '0')
      return `${h}:${m}`
    }

    let cursor = toMinutes(startTime)
    const end = toMinutes(endTime)
    while (cursor + 30 <= end) {
      result.push({ startTime: toTime(cursor), endTime: toTime(cursor + 30) })
      cursor += 30
    }

    return result
  }, [startTime, endTime])

  const fetchDoctors = async () => {
    if (!department.trim()) {
      toast.error('Please enter a department name')
      return
    }
    
    try {
      setIsLoadingDoctors(true)
      console.log('Fetching doctors for department:', department)
      const response = await receptionApi.getConsultantInfo(undefined, department)
      console.log('Doctor fetch response:', response)
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setDoctors(response.data as any[])
        if (response.data.length === 0) {
          toast.info('No doctors found in this department')
        } else {
          toast.success(`Loaded ${response.data.length} doctors`)
        }
      } else {
        setDoctors([])
        toast.info('No doctors found in this department')
      }
    } catch (error) {
      console.error('Failed to load doctors:', error)
      toast.error('Failed to load doctors')
      setDoctors([])
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  const handleDoctorChange = (id: string) => {
    setDoctorId(id)
    const selected = doctors.find((d) => d._id === id)
    if (selected) {
      const name = selected.firstName && selected.lastName 
        ? `Dr. ${selected.firstName} ${selected.lastName}`
        : selected.firstName || selected.lastName || 'Unknown Doctor'
      setDoctorName(name)
    } else {
      setDoctorName('')
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!department.trim()) {
      toast.error('Department is required')
      return
    }
    if (!doctorId) {
      toast.error('Doctor selection is required')
      return
    }
    if (!date) {
      toast.error('Date is required')
      return
    }
    if (slotsPreview.length === 0) {
      toast.error('Time slots could not be generated. Check start and end times.')
      return
    }

    try {
      setIsSubmitting(true)
      console.log('Submitting doctor schedule:', {
        doctorId,
        doctorName,
        department,
        doctorType,
        date,
        timeSlots: slotsPreview,
      })
      
      const response = await receptionApi.createDoctorSchedule({
        doctorId,
        doctorName,
        department,
        doctorType,
        date, // ISO date string: YYYY-MM-DD
        timeSlots: slotsPreview,
      })

      console.log('Schedule submission response:', response)

      if (response.success) {
        toast.success(`Doctor schedule saved for ${slotsPreview.length} slots (${doctorType})`)
        // Reset form
        setDoctorId('')
        setDoctorName('')
        setDate(getTodayDate())
        setDoctorType('General')
        setStartTime('09:00')
        setEndTime('12:00')
        setDoctors([])
      } else {
        toast.error(response.message || 'Failed to save schedule')
      }
    } catch (error) {
      console.error('Schedule submission error:', error)
      toast.error('Failed to save schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Doctor Scheduling</h1>
        <p className="text-muted-foreground mt-2 text-base">Select department and doctor, choose date, type and visiting hours.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Entry</CardTitle>
          <CardDescription>Department &gt; Doctor ID &gt; Doctor Name &gt; Date &gt; Type &gt; Visiting Hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchDoctors} disabled={isLoadingDoctors}>
                {isLoadingDoctors ? 'Loading...' : 'Load Doctors'}
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">Doctor ID</label>
              <select 
                className="w-full px-3 py-2 border rounded-md bg-background" 
                value={doctorId} 
                onChange={(e) => handleDoctorChange(e.target.value)}
                disabled={doctors.length === 0}
              >
                <option value="">
                  {doctors.length === 0 ? 'Load doctors first' : 'Select doctor'}
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.firstName} {doctor.lastName} ({doctor._id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Doctor Name</label>
              <Input value={doctorName} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Doctor Type</label>
              <select className="w-full px-3 py-2 border rounded-md bg-background" value={doctorType} onChange={(e) => setDoctorType(e.target.value)}>
                <option>General</option>
                <option>Emergency</option>
                <option>Consultant</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Visiting Start</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Visiting End</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Slots ({slotsPreview.length})</p>
            <div className="flex flex-wrap gap-2">
              {slotsPreview.map((slot) => (
                <Badge key={`${slot.startTime}-${slot.endTime}`} variant="outline">
                  {slot.startTime} - {slot.endTime}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Submit Schedule'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
