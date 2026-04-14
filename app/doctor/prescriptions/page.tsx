'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pill, AlertCircle, Loader2, Plus, Search, Eye, Printer, Edit, Clock, Calendar, User, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { doctorApi, receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface Prescription {
  _id: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  status: 'active' | 'completed' | 'discontinued'
  createdAt: string
  updatedAt: string
  doctorName?: string
}

interface Patient {
  _id: string
  patientId: string
  demographics: {
    fullName: string
    age: number
    sex: string
    phone: string
    email?: string
  }
}

interface FormData {
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export default function DoctorPrescriptionsPage() {
  const PAGE_SIZE = 5

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([])
  const [historyPrescriptions, setHistoryPrescriptions] = useState<Prescription[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  
  // Patient search
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([])
  const [isSearchingPatient, setIsSearchingPatient] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    patientName: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })

  useEffect(() => {
    loadPrescriptions()
  }, [])

  const loadPrescriptions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await doctorApi.getPrescriptions()

      if (response.success && response.data) {
        setPrescriptions(response.data)
        setActivePrescriptions(response.data.filter((p: Prescription) => p.status === 'active'))
        setHistoryPrescriptions(response.data.filter((p: Prescription) => p.status !== 'active'))
        setActivePage(1)
        setHistoryPage(1)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prescriptions'
      setError(message)
      toast.error('Error', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const searchPatients = async () => {
    if (!searchPatientQuery.trim()) return
    
    try {
      setIsSearchingPatient(true)
      const response = await receptionApi.searchPatient(searchPatientQuery)
      if (response.success && response.data) {
        const patientData = response.data.patientInfo
        if (patientData) {
          setPatientSearchResults([{
            _id: patientData._id,
            patientId: patientData.patientId,
            demographics: patientData.demographics
          }])
        } else {
          setPatientSearchResults([])
          toast.info('No patient found')
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      toast.error('Failed to search patients')
    } finally {
      setIsSearchingPatient(false)
    }
  }

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.medication || !formData.dosage || !formData.frequency) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await doctorApi.createPrescription({
        patientId: formData.patientId,
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration,
        instructions: formData.instructions,
      })

      if (response.success) {
        toast.success('Prescription created successfully')
        setFormData({
          patientId: '',
          patientName: '',
          medication: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
        })
        setSelectedPatient(null)
        setSearchPatientQuery('')
        setPatientSearchResults([])
        setShowCreateForm(false)
        loadPrescriptions()
      } else {
        toast.error(response.message || 'Failed to create prescription')
      }
    } catch (err) {
      toast.error('Error creating prescription')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (prescriptionId: string, newStatus: string) => {
    try {
      const response = await doctorApi.updatePrescriptionStatus(prescriptionId, {
        status: newStatus,
      })

      if (response?.success) {
        toast.success(`Prescription ${newStatus}`)
        loadPrescriptions()
      } else {
        toast.error('Failed to update prescription')
      }
    } catch (err) {
      toast.error('Error updating prescription')
    }
  }

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setShowDetailModal(true)
  }

  const handlePrintPrescription = (prescription: Prescription) => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prescription - ${prescription.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .hospital-name { font-size: 24px; font-weight: bold; }
            .prescription-title { font-size: 18px; margin-top: 20px; margin-bottom: 20px; }
            .patient-info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; }
            .medication-details { margin-bottom: 20px; }
            .medication-item { margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .doctor-signature { margin-top: 40px; text-align: right; }
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">City Hospital</div>
            <div>123 Healthcare Avenue, Medical District</div>
            <div>Phone: (555) 123-4567 | Email: info@cityhospital.com</div>
          </div>
          
          <div class="prescription-title">MEDICAL PRESCRIPTION</div>
          
          <div class="patient-info">
            <strong>Patient Name:</strong> ${prescription.patientName}<br>
            <strong>Patient ID:</strong> ${prescription.patientId}<br>
            <strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}<br>
            <strong>Prescription ID:</strong> ${prescription._id}
          </div>
          
          <div class="medication-details">
            <h3>Medication Details</h3>
            <div class="medication-item">
              <strong>Medication:</strong> ${prescription.medication}<br>
              <strong>Dosage:</strong> ${prescription.dosage}<br>
              <strong>Frequency:</strong> ${prescription.frequency}<br>
              <strong>Duration:</strong> ${prescription.duration}<br>
              ${prescription.instructions ? `<strong>Instructions:</strong> ${prescription.instructions}<br>` : ''}
            </div>
          </div>
          
          <div class="doctor-signature">
            <strong>Doctor's Signature</strong><br>
            ____________________<br>
            Dr. ${prescription.doctorName || 'Attending Physician'}
          </div>
          
          <div class="footer">
            This is a computer-generated prescription. No signature required for electronic copy.<br>
            For any queries, please contact the hospital pharmacy.
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">Print Prescription</button>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      discontinued: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const PrescriptionCard = ({ rx, showActions = true }: { rx: Prescription; showActions?: boolean }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Pill className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{rx.patientName}</h3>
          {getStatusBadge(rx.status)}
          <Badge variant="outline" className="text-xs">
            {new Date(rx.createdAt).toLocaleDateString()}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-2">
          <div>
            <span className="font-medium text-foreground">Medication:</span> {rx.medication}
          </div>
          <div>
            <span className="font-medium text-foreground">Dosage:</span> {rx.dosage}
          </div>
          <div>
            <span className="font-medium text-foreground">Frequency:</span> {rx.frequency}
          </div>
          <div>
            <span className="font-medium text-foreground">Duration:</span> {rx.duration}
          </div>
        </div>
        {rx.instructions && (
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Instructions:</strong> {rx.instructions}
          </p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleViewPrescription(rx)}>
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => handlePrintPrescription(rx)}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          {rx.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(rx._id, 'completed')}
                className="text-emerald-600"
              >
                <CheckIcon className="h-4 w-4 mr-1" /> Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(rx._id, 'discontinued')}
                className="text-red-600"
              >
                <XIcon className="h-4 w-4 mr-1" /> Discontinue
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  const activeTotalPages = Math.max(1, Math.ceil(activePrescriptions.length / PAGE_SIZE))
  const historyTotalPages = Math.max(1, Math.ceil(historyPrescriptions.length / PAGE_SIZE))
  const paginatedActivePrescriptions = activePrescriptions.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const paginatedHistoryPrescriptions = historyPrescriptions.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Prescriptions Management</h1>
        <p className="text-muted-foreground mt-2 text-base">
          View patient prescriptions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-start justify-between">
          <div>
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
          </div>
          <button
            onClick={loadPrescriptions}
            className="underline font-semibold hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activePrescriptions.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyPrescriptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Prescriptions</CardTitle>
              <CardDescription>
                Currently active prescriptions for your patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePrescriptions.length > 0 ? (
                paginatedActivePrescriptions.map((rx) => (
                  <PrescriptionCard key={rx._id} rx={rx} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                </div>
              )}
              {activePrescriptions.length > PAGE_SIZE && (
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

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription History</CardTitle>
              <CardDescription>Past and discontinued prescriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyPrescriptions.length > 0 ? (
                paginatedHistoryPrescriptions.map((rx) => (
                  <PrescriptionCard key={rx._id} rx={rx} showActions={false} />
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No prescription history</p>
                </div>
              )}
              {historyPrescriptions.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {historyPage} of {historyTotalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                    disabled={historyPage === historyTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Prescription Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">New Prescription</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>✕</Button>
              </div>
              
              <form onSubmit={handleCreatePrescription} className="space-y-6">
                {/* Patient Selection */}
                {!selectedPatient ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">Search Patient *</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Enter patient name, ID, or phone..."
                          value={searchPatientQuery}
                          onChange={(e) => setSearchPatientQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <Button type="button" onClick={searchPatients} disabled={isSearchingPatient}>
                        {isSearchingPatient ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                      </Button>
                    </div>
                    
                    {patientSearchResults.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {patientSearchResults.map((patient) => (
                          <div key={patient._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-semibold">{patient.demographics.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {patient.patientId} • Age: {patient.demographics.age} • {patient.demographics.sex}
                              </p>
                              <p className="text-sm text-muted-foreground">Phone: {patient.demographics.phone}</p>
                            </div>
                            <Button type="button" size="sm" onClick={() => {
                              setSelectedPatient(patient)
                              setFormData({
                                ...formData,
                                patientId: patient.patientId,
                                patientName: patient.demographics.fullName,
                              })
                            }}>
                              Select
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Prescribing for</p>
                      <p className="font-semibold text-lg">{selectedPatient.demographics.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedPatient.patientId} | Age: {selectedPatient.demographics.age} | {selectedPatient.demographics.sex}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setSelectedPatient(null)
                      setFormData({ ...formData, patientId: '', patientName: '' })
                    }}>
                      Change
                    </Button>
                  </div>
                )}

                {selectedPatient && (
                  <>
                    {/* Medication Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Medication Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Medication Name *</label>
                          <input
                            type="text"
                            placeholder="e.g., Lisinopril, Metformin"
                            value={formData.medication}
                            onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Dosage *</label>
                          <input
                            type="text"
                            placeholder="e.g., 10mg, 500mg"
                            value={formData.dosage}
                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Frequency *</label>
                          <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                          >
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="As needed">As needed</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="At bedtime">At bedtime</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g., 7 days, 30 days, 2 weeks"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Special Instructions</label>
                        <textarea
                          placeholder="e.g., Take with food, Avoid alcohol, Complete full course"
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background h-24"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pill className="h-4 w-4 mr-2" />}
                      Create Prescription
                    </Button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {showDetailModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Prescription Details</h2>
                  <p className="text-muted-foreground">Prescription ID: {selectedPrescription._id}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>✕</Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient Name</p>
                    <p className="font-semibold">{selectedPrescription.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient ID</p>
                    <p className="font-semibold">{selectedPrescription.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedPrescription.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prescribed Date</p>
                    <p className="font-semibold">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Medication Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Medication</p>
                        <p className="font-medium">{selectedPrescription.medication}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dosage</p>
                        <p className="font-medium">{selectedPrescription.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="font-medium">{selectedPrescription.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{selectedPrescription.duration}</p>
                      </div>
                    </div>
                    {selectedPrescription.instructions && (
                      <div>
                        <p className="text-sm text-muted-foreground">Instructions</p>
                        <p className="text-sm">{selectedPrescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => handlePrintPrescription(selectedPrescription)}>
                    <Printer className="h-4 w-4 mr-2" /> Print Prescription
                  </Button>
                  {selectedPrescription.status === 'active' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-emerald-600"
                        onClick={() => {
                          handleUpdateStatus(selectedPrescription._id, 'completed')
                          setShowDetailModal(false)
                        }}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" /> Mark Complete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper icons
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}