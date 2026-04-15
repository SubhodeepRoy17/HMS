'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Plus, Loader2, AlertCircle, User, Phone, Calendar, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'

interface PatientRecord {
  _id: string
  patientId: string
  registrationNumber: string
  patientType: 'OPD' | 'IPD'
  demographics: {
    firstName: string
    lastName: string
    fullName: string
    age: number
    sex: string
    phone: string
    email: string
    address?: string
  }
  department: string
  consultantName: string
  registrationDate: string
  status: string
}

interface Doctor {
  _id: string
  firstName: string
  lastName: string
  specialization: string
  department: string
}

export default function ReceptionistPatientRecordsPage() {
  const PAGE_SIZE = 5
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [activePage, setActivePage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Registration form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientType, setPatientType] = useState<'OPD' | 'IPD'>('OPD')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    sex: 'Male',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    nationality: 'Indian',
    department: '',
    consultantId: '',
    consultantName: '',
    referringSource: 'Self',
    sponsorship: 'Cash',
    collectConsultationCharge: false,
    consultationCharge: '0',
    paymentMethod: 'Cash',
    // IPD specific
    roomNumber: '',
    bedNumber: '',
    expectedDischargeDate: '',
    treatmentRequired: '',
  })

  useEffect(() => {
    setIsClient(true)
    loadPatients()
    loadDoctors()
  }, [])

  const loadPatients = async (search?: string) => {
    try {
      setIsLoading(true)
      const response = await receptionApi.getPatients(search, undefined, 1, 50)
      if (response.success && response.data) {
        setPatients(response.data)
        setActivePage(1)
        setAllPage(1)
      }
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const response = await receptionApi.getConsultantInfo()
      if (response.success && response.data) {
        setDoctors(response.data)
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const handleSearch = () => {
    loadPatients(searchQuery)
  }

  const handleViewPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient)
    setShowDetailModal(true)
  }

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.age || !formData.phone || !formData.email || !formData.department || !formData.consultantId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone,
        email: formData.email,
        nationality: formData.nationality,
        department: formData.department,
        consultantId: formData.consultantId,
        consultantName: formData.consultantName,
        referringSource: formData.referringSource,
        sponsorship: formData.sponsorship,
        collectConsultationCharge: formData.collectConsultationCharge,
        consultationCharge: Number(formData.consultationCharge || 0),
        paymentMethod: formData.paymentMethod,
      }

      let response
      if (patientType === 'OPD') {
        response = await receptionApi.registerOPDPatient(registrationData)
      } else {
        response = await receptionApi.registerIPDPatient({
          ...registrationData,
          roomNumber: formData.roomNumber,
          bedNumber: formData.bedNumber,
          expectedDischargeDate: formData.expectedDischargeDate,
          treatmentRequired: formData.treatmentRequired,
        })
      }

      if (response.success) {
        toast.success(`${patientType} patient registered successfully`)

        const credentials = response.credentials || response.data?.credentials
        if (credentials?.email && credentials?.password) {
          toast.success(
            `Patient login created. Email: ${credentials.email} | Password: ${credentials.password}`,
            { duration: 12000 }
          )
        }

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          age: '',
          sex: 'Male',
          dateOfBirth: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          email: '',
          nationality: 'Indian',
          department: '',
          consultantId: '',
          consultantName: '',
          referringSource: 'Self',
          sponsorship: 'Cash',
          collectConsultationCharge: false,
          consultationCharge: '0',
          paymentMethod: 'Cash',
          roomNumber: '',
          bedNumber: '',
          expectedDischargeDate: '',
          treatmentRequired: '',
        })
        loadPatients()
      } else {
        toast.error(response.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to register patient')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (doctor) {
      setFormData({
        ...formData,
        consultantId: doctorId,
        consultantName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        department: doctor.department,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      discharged: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const activePatients = patients.filter((patient) => patient.status === 'active')
  const activeTotalPages = Math.max(1, Math.ceil(activePatients.length / PAGE_SIZE))
  const allTotalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE))

  const paginatedActivePatients = activePatients.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  )

  const paginatedAllPatients = patients.slice(
    (allPage - 1) * PAGE_SIZE,
    allPage * PAGE_SIZE
  )

  const handlePrintRegistration = (patient: PatientRecord) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const title = patient.patientType === 'OPD' ? 'OPD Card' : 'Admission Form'
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${patient.patientId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h1 { margin-bottom: 4px; }
            .muted { color: #666; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .field { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
            .label { font-size: 12px; color: #666; }
            .value { font-weight: 600; }
            .full { grid-column: 1 / span 2; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="muted">Hospital Management System</p>
          <div class="grid">
            <div class="field"><div class="label">Patient ID</div><div class="value">${patient.patientId}</div></div>
            <div class="field"><div class="label">Registration Number</div><div class="value">${patient.registrationNumber}</div></div>
            <div class="field"><div class="label">Name</div><div class="value">${patient.demographics.fullName}</div></div>
            <div class="field"><div class="label">Age / Sex</div><div class="value">${patient.demographics.age} / ${patient.demographics.sex}</div></div>
            <div class="field"><div class="label">Phone</div><div class="value">${patient.demographics.phone}</div></div>
            <div class="field"><div class="label">Department</div><div class="value">${patient.department}</div></div>
            <div class="field full"><div class="label">Consultant</div><div class="value">${patient.consultantName}</div></div>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Patient Records</h1>
        <p className="text-muted-foreground mt-2 text-base">Access and manage patient information</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-3 py-2 border rounded-md bg-background"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={(value) => {
        if (value === 'new') setPatientType('OPD')
      }}>
        <TabsList>
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="new">New Registration</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Patients</CardTitle>
              <CardDescription>Currently active patient records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activePatients.length > 0 ? (
                paginatedActivePatients.map((patient) => (
                  <div key={patient._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{patient.demographics.fullName}</h3>
                        {getStatusBadge(patient.status)}
                        <Badge variant="outline">{patient.patientType}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span>ID: {patient.patientId}</span>
                        <span>{patient.demographics.phone}</span>
                        <span>Age: {patient.demographics.age}</span>
                        <span>Reg: {new Date(patient.registrationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewPatient(patient)}>
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info('Patient edit form will be enabled in next iteration. Use View for details currently.')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No patients found</p>
                </div>
              )}
              {activePatients.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                    disabled={activePage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {activePage} of {activeTotalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePage((prev) => Math.min(activeTotalPages, prev + 1))}
                    disabled={activePage === activeTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Patient Records</CardTitle>
              <CardDescription>Complete patient database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedAllPatients.map((patient) => (
                <div key={patient._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{patient.demographics.fullName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{patient.patientId}</span>
                      <span>{patient.demographics.phone}</span>
                      <span>{patient.demographics.email || 'No email'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(patient.status)}
                    <Button size="sm" variant="outline" onClick={() => handleViewPatient(patient)}>
                      Actions
                    </Button>
                  </div>
                </div>
              ))}
              {patients.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllPage((prev) => Math.max(1, prev - 1))}
                    disabled={allPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {allPage} of {allTotalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllPage((prev) => Math.min(allTotalPages, prev + 1))}
                    disabled={allPage === allTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Register New Patient</CardTitle>
              <CardDescription>Create a new patient record (OPD or IPD)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterPatient} className="space-y-6">
                {/* Patient Type Selection */}
                <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <Button
                    type="button"
                    variant={patientType === 'OPD' ? 'default' : 'outline'}
                    onClick={() => setPatientType('OPD')}
                    className="flex-1"
                  >
                    OPD Patient
                  </Button>
                  <Button
                    type="button"
                    variant={patientType === 'IPD' ? 'default' : 'outline'}
                    onClick={() => setPatientType('IPD')}
                    className="flex-1"
                  >
                    IPD Patient (Admission)
                  </Button>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Age *</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Gender *</label>
                      <select
                        value={formData.sex}
                        onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nationality</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Department *</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      >
                        <option value="">Select Department</option>
                        <option>Cardiology</option>
                        <option>Neurology</option>
                        <option>Orthopedics</option>
                        <option>General Medicine</option>
                        <option>Pediatrics</option>
                        <option>Gynecology</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Consulting Doctor *</label>
                      <select
                        value={formData.consultantId}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Referring Source</label>
                      <input
                        type="text"
                        value={formData.referringSource}
                        onChange={(e) => setFormData({ ...formData, referringSource: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Sponsorship/Panel</label>
                      <input
                        type="text"
                        value={formData.sponsorship}
                        onChange={(e) => setFormData({ ...formData, sponsorship: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>

                    {patientType === 'OPD' && (
                      <>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <input
                            id="collectConsultationCharge"
                            type="checkbox"
                            checked={formData.collectConsultationCharge}
                            onChange={(e) => setFormData({ ...formData, collectConsultationCharge: e.target.checked })}
                          />
                          <label htmlFor="collectConsultationCharge" className="text-sm font-medium">
                            Collect consultation charge at registration and generate receipt
                          </label>
                        </div>

                        {formData.collectConsultationCharge && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-2">Consultation Charge</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.consultationCharge}
                                onChange={(e) => setFormData({ ...formData, consultationCharge: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Payment Method</label>
                              <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                              >
                                <option>Cash</option>
                                <option>Card</option>
                                <option>UPI</option>
                                <option>Online</option>
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* IPD Specific Fields */}
                {patientType === 'IPD' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Admission Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Room Number *</label>
                        <input
                          type="text"
                          value={formData.roomNumber}
                          onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="e.g., 101, 202"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Bed Number</label>
                        <input
                          type="text"
                          value={formData.bedNumber}
                          onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="e.g., A, B, 1, 2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Expected Discharge Date</label>
                        <input
                          type="date"
                          value={formData.expectedDischargeDate}
                          onChange={(e) => setFormData({ ...formData, expectedDischargeDate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Treatment Required</label>
                        <textarea
                          value={formData.treatmentRequired}
                          onChange={(e) => setFormData({ ...formData, treatmentRequired: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          rows={2}
                          placeholder="Brief description of treatment required"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Register {patientType} Patient
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Detail Modal */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Patient Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>✕</Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient ID</p>
                    <p className="font-semibold">{selectedPatient.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-semibold">{selectedPatient.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{selectedPatient.demographics.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age / Gender</p>
                    <p className="font-semibold">{selectedPatient.demographics.age} / {selectedPatient.demographics.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedPatient.demographics.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedPatient.demographics.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{selectedPatient.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consultant</p>
                    <p className="font-semibold">{selectedPatient.consultantName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-semibold">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient Type</p>
                    <p className="font-semibold">{selectedPatient.patientType}</p>
                  </div>
                </div>
                
                {selectedPatient.demographics.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">{selectedPatient.demographics.address}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => handlePrintRegistration(selectedPatient)}>
                    Print {selectedPatient.patientType === 'OPD' ? 'OPD Card' : 'Admission Form'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}