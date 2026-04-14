'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { receptionApi } from '@/lib/api-client'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function ReceptionistEnquiriesPage() {
  const [isPatientLoading, setIsPatientLoading] = useState(false)
  const [isConsultantLoading, setIsConsultantLoading] = useState(false)
  const [isRoomLoading, setIsRoomLoading] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [consultantQuery, setConsultantQuery] = useState('')
  const [patientData, setPatientData] = useState<any | null>(null)
  const [consultants, setConsultants] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [roomSummary, setRoomSummary] = useState<any | null>(null)
  const [tariffs, setTariffs] = useState<any | null>(null)

  const outstanding = useMemo(() => patientData?.billingSummary?.outstanding || 0, [patientData])

  const handlePatientSearch = async () => {
    if (!patientQuery.trim()) return
    try {
      setIsPatientLoading(true)
      const response = await receptionApi.searchPatient(patientQuery)
      if (response.success && response.data) {
        setPatientData(response.data)
      } else {
        setPatientData(null)
        toast.info('Patient not found')
      }
    } catch (error) {
      toast.error('Failed to search patient')
    } finally {
      setIsPatientLoading(false)
    }
  }

  const handleConsultantSearch = async () => {
    try {
      setIsConsultantLoading(true)
      const response = await receptionApi.getConsultantInfo(undefined, undefined, consultantQuery || undefined)
      if (response.success && response.data) {
        setConsultants(response.data as any[])
      } else {
        setConsultants([])
      }
    } catch {
      toast.error('Failed to fetch consultant information')
    } finally {
      setIsConsultantLoading(false)
    }
  }

  const loadRoomStatus = async () => {
    try {
      setIsRoomLoading(true)
      const response = await receptionApi.getRoomStatus()
      if (response.success && response.data) {
        setRooms(response.data.rooms || [])
        setRoomSummary(response.data.summary || null)
      }
    } catch {
      toast.error('Failed to load room status')
    } finally {
      setIsRoomLoading(false)
    }
  }

  const loadTariffs = async () => {
    try {
      const response = await receptionApi.getTariffs()
      if (response.success && response.data) {
        setTariffs(response.data)
      }
    } catch {
      toast.error('Failed to load tariffs')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Reception Enquiries</h1>
        <p className="text-muted-foreground mt-2 text-base">Patient, consultant, room status, and tariff enquiries in one place.</p>
      </div>

      <Tabs defaultValue="patient" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="patient">Patient Enquiry</TabsTrigger>
          <TabsTrigger value="consultant">Consultants Enquiry</TabsTrigger>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
          <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
        </TabsList>

        <TabsContent value="patient" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Enquiry</CardTitle>
              <CardDescription>Search by patient name, ID, or phone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search patient..." />
                <Button onClick={handlePatientSearch} disabled={isPatientLoading}>
                  {isPatientLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {patientData && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <p className="font-semibold">{patientData.patientInfo?.demographics?.fullName}</p>
                  <p className="text-sm text-muted-foreground">Patient ID: {patientData.patientInfo?.patientId}</p>
                  <p className="text-sm text-muted-foreground">Status: {patientData.patientInfo?.status}</p>
                  <p className="text-sm text-muted-foreground">Total visits: {patientData.totalVisits}</p>
                  <p className="text-sm text-muted-foreground">Outstanding: ₹{Number(outstanding).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultant" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultants Enquiry</CardTitle>
              <CardDescription>Availability, days/time, specialization and department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={consultantQuery} onChange={(e) => setConsultantQuery(e.target.value)} placeholder="Search specialization (optional)" />
                <Button onClick={handleConsultantSearch} disabled={isConsultantLoading}>
                  {isConsultantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                </Button>
              </div>

              <div className="space-y-3">
                {consultants.map((doctor) => (
                  <div key={doctor._id} className="p-4 border rounded-lg">
                    <p className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialization} • {doctor.department}</p>
                    <p className="text-xs text-muted-foreground mt-1">Available slots: {doctor.availableSlots?.length || 0}</p>
                  </div>
                ))}
                {consultants.length === 0 && <p className="text-sm text-muted-foreground">No consultant data loaded</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Status</CardTitle>
              <CardDescription>Real-time bed occupancy and room availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={loadRoomStatus} disabled={isRoomLoading}>
                {isRoomLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh Room Status
              </Button>

              {roomSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground">Rooms</p><p className="font-semibold">{roomSummary.totalRooms}</p></div>
                  <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground">Beds</p><p className="font-semibold">{roomSummary.totalBeds}</p></div>
                  <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground">Occupied</p><p className="font-semibold">{roomSummary.occupiedBeds}</p></div>
                  <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground">Available</p><p className="font-semibold">{roomSummary.availableBeds}</p></div>
                </div>
              )}

              <div className="space-y-2">
                {rooms.map((room) => (
                  <div key={room.roomNumber} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Room {room.roomNumber}</p>
                      <p className="text-xs text-muted-foreground">{room.roomType} • Floor {room.floor} • ₹{room.dailyRate}/day</p>
                    </div>
                    <Badge>{room.availableBeds}/{room.totalBeds} free</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tariffs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tariffs & Charges</CardTitle>
              <CardDescription>Category-wise rates with time and emergency multipliers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={loadTariffs}>Load Tariffs</Button>

              {tariffs?.baseRates && (
                <div className="space-y-3">
                  {Object.entries(tariffs.baseRates).map(([category, rates]: any) => (
                    <div key={category} className="p-3 border rounded-lg">
                      <p className="font-semibold mb-2">{category}</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        {Object.entries(rates).map(([k, v]: any) => (
                          <p key={k} className="text-muted-foreground">{k}: ₹{v}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
