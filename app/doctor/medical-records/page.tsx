'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Search, AlertCircle, Loader2, Plus, Eye, Download, Filter, Calendar, User } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { doctorApi, receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface MedicalRecord {
  _id: string
  patientId: string
  patientName: string
  recordType: 'lab' | 'imaging' | 'pathology' | 'clinical'
  description: string
  findings: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Patient {
  _id: string
  patientId: string
  demographics: {
    fullName: string
    age: number
    sex: string
    phone: string
  }
}

interface FormData {
  patientId: string
  patientName: string
  recordType: 'lab' | 'imaging' | 'pathology' | 'clinical'
  description: string
  findings: string
  status: string
}

export default function DoctorMedicalRecordsPage() {
  const PAGE_SIZE = 5

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
  const [recordTypeFilter, setRecordTypeFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSearchingPatient, setIsSearchingPatient] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [allPage, setAllPage] = useState(1)
  const [clinicalPage, setClinicalPage] = useState(1)
  const [labPage, setLabPage] = useState(1)
  const [imagingPage, setImagingPage] = useState(1)
  
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    patientName: '',
    recordType: 'clinical',
    description: '',
    findings: '',
    status: 'active',
  })

  useEffect(() => {
    loadRecords()
    loadPatients()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [records, searchQuery, recordTypeFilter])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await doctorApi.getMedicalRecords()

      if (response.success && response.data) {
        setRecords(response.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load medical records'
      setError(message)
      toast.error('Error', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPatients = async () => {
    try {
      const response = await receptionApi.getPatients()
      if (response.success && response.data) {
        setPatients(response.data)
      }
    } catch (err) {
      console.error('Error loading patients:', err)
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
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      toast.error('Failed to search patients')
    } finally {
      setIsSearchingPatient(false)
    }
  }

  const filterRecords = () => {
    let filtered = records

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (recordTypeFilter !== 'all') {
      filtered = filtered.filter((r) => r.recordType === recordTypeFilter)
    }

    setFilteredRecords(filtered)
    setAllPage(1)
    setClinicalPage(1)
    setLabPage(1)
    setImagingPage(1)
  }

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await doctorApi.createMedicalRecord({
        patientId: formData.patientId,
        patientName: formData.patientName,
        recordType: formData.recordType,
        description: formData.description,
        findings: formData.findings,
        status: formData.status,
      })

      if (response.success) {
        toast.success('Medical record created successfully')
        setFormData({
          patientId: '',
          patientName: '',
          recordType: 'clinical',
          description: '',
          findings: '',
          status: 'active',
        })
        setSelectedPatient(null)
        setSearchPatientQuery('')
        setPatientSearchResults([])
        setShowCreateForm(false)
        loadRecords()
      } else {
        toast.error('Failed to create medical record')
      }
    } catch (err) {
      toast.error('Error creating medical record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  const getRecordTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      lab: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      imaging: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      pathology: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      clinical: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return <Badge className={variants[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
  }

  const RecordCard = ({ record }: { record: MedicalRecord }) => (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{record.patientName}</h3>
          {getRecordTypeBadge(record.recordType)}
          <Badge variant="outline" className="text-xs">
            {new Date(record.createdAt).toLocaleDateString()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Patient ID: {record.patientId}
        </p>
        <p className="text-sm font-medium">Description:</p>
        <p className="text-sm text-muted-foreground">{record.description}</p>
        {record.findings && (
          <>
            <p className="text-sm font-medium mt-2">Findings:</p>
            <p className="text-sm text-muted-foreground">{record.findings}</p>
          </>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={() => handleViewRecord(record)}>
        <Eye className="h-4 w-4 mr-1" /> View
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const getTypeCount = (type: string) => {
    if (type === 'all') return records.length
    return records.filter(r => r.recordType === type).length
  }

  const clinicalRecords = filteredRecords.filter((r) => r.recordType === 'clinical')
  const labRecords = filteredRecords.filter((r) => r.recordType === 'lab')
  const imagingRecords = filteredRecords.filter((r) => r.recordType === 'imaging')

  const allTotalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const clinicalTotalPages = Math.max(1, Math.ceil(clinicalRecords.length / PAGE_SIZE))
  const labTotalPages = Math.max(1, Math.ceil(labRecords.length / PAGE_SIZE))
  const imagingTotalPages = Math.max(1, Math.ceil(imagingRecords.length / PAGE_SIZE))

  const paginatedAllRecords = filteredRecords.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE)
  const paginatedClinicalRecords = clinicalRecords.slice((clinicalPage - 1) * PAGE_SIZE, clinicalPage * PAGE_SIZE)
  const paginatedLabRecords = labRecords.slice((labPage - 1) * PAGE_SIZE, labPage * PAGE_SIZE)
  const paginatedImagingRecords = imagingRecords.slice((imagingPage - 1) * PAGE_SIZE, imagingPage * PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Medical Records</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Access and manage patient medical records
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-start justify-between">
          <div>
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
          </div>
          <button
            onClick={loadRecords}
            className="underline font-semibold hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md bg-background"
          />
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Record
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setRecordTypeFilter(v)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All ({getTypeCount('all')})</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Notes ({getTypeCount('clinical')})</TabsTrigger>
          <TabsTrigger value="lab">Lab Tests ({getTypeCount('lab')})</TabsTrigger>
          <TabsTrigger value="imaging">Imaging ({getTypeCount('imaging')})</TabsTrigger>
          <TabsTrigger value="pathology">Pathology ({getTypeCount('pathology')})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Medical Records</CardTitle>
              <CardDescription>Complete patient medical history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredRecords.length > 0 ? (
                paginatedAllRecords.map((record) => (
                  <RecordCard key={record._id} record={record} />
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {records.length === 0
                      ? 'No medical records found'
                      : 'No records match your search'}
                  </p>
                </div>
              )}
              {filteredRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setAllPage((prev) => Math.max(1, prev - 1))} disabled={allPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {allPage} of {allTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setAllPage((prev) => Math.min(allTotalPages, prev + 1))} disabled={allPage === allTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedClinicalRecords.map((record) => (
                <RecordCard key={record._id} record={record} />
              ))}
              {clinicalRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No clinical records found</div>
              )}
              {clinicalRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setClinicalPage((prev) => Math.max(1, prev - 1))} disabled={clinicalPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {clinicalPage} of {clinicalTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setClinicalPage((prev) => Math.min(clinicalTotalPages, prev + 1))} disabled={clinicalPage === clinicalTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedLabRecords.map((record) => (
                <RecordCard key={record._id} record={record} />
              ))}
              {labRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No lab records found</div>
              )}
              {labRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setLabPage((prev) => Math.max(1, prev - 1))} disabled={labPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {labPage} of {labTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setLabPage((prev) => Math.min(labTotalPages, prev + 1))} disabled={labPage === labTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imaging" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Imaging Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedImagingRecords.map((record) => (
                <RecordCard key={record._id} record={record} />
              ))}
              {imagingRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No imaging records found</div>
              )}
              {imagingRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setImagingPage((prev) => Math.max(1, prev - 1))} disabled={imagingPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {imagingPage} of {imagingTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setImagingPage((prev) => Math.min(imagingTotalPages, prev + 1))} disabled={imagingPage === imagingTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Record Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Create Medical Record</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>✕</Button>
              </div>
              
              <form onSubmit={handleCreateRecord} className="space-y-6">
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
                      <p className="text-sm text-muted-foreground">Selected Patient</p>
                      <p className="font-semibold">{selectedPatient.demographics.fullName}</p>
                      <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
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
                    <div>
                      <label className="block text-sm font-medium mb-2">Record Type *</label>
                      <select
                        value={formData.recordType}
                        onChange={(e) => setFormData({ ...formData, recordType: e.target.value as FormData['recordType'] })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      >
                        <option value="clinical">Clinical Notes</option>
                        <option value="lab">Lab Test</option>
                        <option value="imaging">Imaging</option>
                        <option value="pathology">Pathology</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the diagnosis, treatment plan, or procedure..."
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Findings / Observations</label>
                      <textarea
                        value={formData.findings}
                        onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                        placeholder="Document your clinical findings, test results, or observations..."
                        rows={4}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Medical Record
                    </Button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Medical Record Details</h2>
                  <p className="text-muted-foreground">Record ID: {selectedRecord._id}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>✕</Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient Name</p>
                    <p className="font-semibold">{selectedRecord.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient ID</p>
                    <p className="font-semibold">{selectedRecord.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Record Type</p>
                    {getRecordTypeBadge(selectedRecord.recordType)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-semibold">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-semibold">{new Date(selectedRecord.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedRecord.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}>
                      {selectedRecord.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <p className="whitespace-pre-wrap">{selectedRecord.description}</p>
                  </div>
                </div>

                {selectedRecord.findings && (
                  <div>
                    <h3 className="font-semibold mb-2">Findings / Observations</h3>
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <p className="whitespace-pre-wrap">{selectedRecord.findings}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Edit Record
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