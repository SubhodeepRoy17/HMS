'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, AlertCircle, Loader2, FileText, Pill, AlertTriangle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { patientApi } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'

interface MedicalCondition {
  _id: string
  condition: string
  diagnosedDate: string
  status: 'active' | 'resolved' | 'under-treatment'
  doctor: string
  notes?: string
}

interface Medication {
  _id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  status: 'active' | 'discontinued'
  prescribedBy: string
}

interface Allergy {
  _id: string
  name: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  reaction: string
  recordedDate: string
}

interface FamilyHistory {
  _id: string
  relation: string
  condition: string
  ageAtDiagnosis?: number
  notes?: string
}

interface Prescription {
  _id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  prescribedDate: string
  status: string
}

export default function PatientMedicalHistoryPage() {
  const PAGE_SIZE = 5

  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [conditions, setConditions] = useState<MedicalCondition[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [familyHistory, setFamilyHistory] = useState<FamilyHistory[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [conditionsPage, setConditionsPage] = useState(1)
  const [medicationsPage, setMedicationsPage] = useState(1)
  const [prescriptionsPage, setPrescriptionsPage] = useState(1)
  const [allergiesPage, setAllergiesPage] = useState(1)
  const [familyPage, setFamilyPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formType, setFormType] = useState<'condition' | 'allergy' | 'family'>('condition')
  const [formData, setFormData] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'active',
    notes: '',
    allergyName: '',
    severity: 'Moderate',
    reaction: '',
    relation: '',
    familyCondition: '',
    ageAtDiagnosis: '',
  })

  useEffect(() => {
    setIsClient(true)
    loadMedicalHistory()
  }, [])

  const loadMedicalHistory = async () => {
    try {
      setIsLoading(true)
      const historyRes = await patientApi.getMedicalHistory()

      if (historyRes.success && historyRes.data) {
        const historyData = historyRes.data as any
        const fetchedPrescriptions = historyData.prescriptions || []
        const fetchedRecords = historyData.medicalRecords || []

        setPrescriptions(
          fetchedPrescriptions.map((p: any) => ({
            _id: p._id,
            medication: p.medication,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            prescribedDate: p.createdAt,
            status: p.status,
          }))
        )

        setConditions(
          fetchedRecords.map((record: any) => ({
            _id: record._id,
            condition: record.recordType,
            diagnosedDate: record.createdAt,
            status: record.status === 'inactive' ? 'resolved' : 'active',
            doctor: record.doctorName || 'Doctor',
            notes: record.description,
          }))
        )

        setMedications(
          fetchedPrescriptions
            .filter((p: any) => p.status === 'active')
            .map((p: any) => ({
              _id: p._id,
              name: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              startDate: p.createdAt,
              endDate: undefined,
              status: p.status,
              prescribedBy: p.doctorName || 'Doctor',
            }))
        )
      }

      setAllergies([])
      setFamilyHistory([])
      setConditionsPage(1)
      setMedicationsPage(1)
      setPrescriptionsPage(1)
      setAllergiesPage(1)
      setFamilyPage(1)
      
    } catch (error) {
      console.error('Error loading medical history:', error)
      toast.error('Failed to load medical history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // In production, this would call an API to add the record
      toast.success(`${formType} added successfully`)
      setShowAddForm(false)
      setFormData({
        condition: '',
        diagnosedDate: '',
        status: 'active',
        notes: '',
        allergyName: '',
        severity: 'Moderate',
        reaction: '',
        relation: '',
        familyCondition: '',
        ageAtDiagnosis: '',
      })
      loadMedicalHistory()
    } catch (error) {
      toast.error('Failed to add record')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'under-treatment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      discontinued: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      Mild: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return <Badge className={variants[severity] || 'bg-gray-100 text-gray-800'}>{severity}</Badge>
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const activeMedications = medications.filter((m) => m.status === 'active')

  const conditionsTotalPages = Math.max(1, Math.ceil(conditions.length / PAGE_SIZE))
  const medicationsTotalPages = Math.max(1, Math.ceil(activeMedications.length / PAGE_SIZE))
  const prescriptionsTotalPages = Math.max(1, Math.ceil(prescriptions.length / PAGE_SIZE))
  const allergiesTotalPages = Math.max(1, Math.ceil(allergies.length / PAGE_SIZE))
  const familyTotalPages = Math.max(1, Math.ceil(familyHistory.length / PAGE_SIZE))

  const paginatedConditions = conditions.slice((conditionsPage - 1) * PAGE_SIZE, conditionsPage * PAGE_SIZE)
  const paginatedMedications = activeMedications.slice((medicationsPage - 1) * PAGE_SIZE, medicationsPage * PAGE_SIZE)
  const paginatedPrescriptions = prescriptions.slice((prescriptionsPage - 1) * PAGE_SIZE, prescriptionsPage * PAGE_SIZE)
  const paginatedAllergies = allergies.slice((allergiesPage - 1) * PAGE_SIZE, allergiesPage * PAGE_SIZE)
  const paginatedFamilyHistory = familyHistory.slice((familyPage - 1) * PAGE_SIZE, familyPage * PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Medical History</h1>
        <p className="text-muted-foreground mt-2 text-base">Your complete medical history and current conditions</p>
      </div>

      {/* Alert Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Always keep your medical history up to date. Share critical information with your healthcare providers.
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="conditions">Medical Conditions</TabsTrigger>
          <TabsTrigger value="medications">Current Medications</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
          <TabsTrigger value="family">Family History</TabsTrigger>
        </TabsList>

        {/* Medical Conditions Tab */}
        <TabsContent value="conditions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medical Conditions</CardTitle>
                  <CardDescription>Your diagnosed medical conditions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : conditions.length > 0 ? (
                paginatedConditions.map((condition) => (
                  <div key={condition._id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{condition.condition}</h3>
                        {getStatusBadge(condition.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()} by {condition.doctor}
                      </p>
                      {condition.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Notes:</strong> {condition.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(`${condition.condition} | ${condition.notes || 'No additional notes'}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No medical conditions recorded</p>
                </div>
              )}
              {conditions.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setConditionsPage((prev) => Math.max(1, prev - 1))} disabled={conditionsPage === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {conditionsPage} of {conditionsTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setConditionsPage((prev) => Math.min(conditionsTotalPages, prev + 1))} disabled={conditionsPage === conditionsTotalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
              <CardDescription>Medications you are currently taking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedMedications.map((med) => (
                <div key={med._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Pill className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{med.name}</h3>
                      {getStatusBadge(med.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} - {med.frequency}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Started: {new Date(med.startDate).toLocaleDateString()} • Prescribed by: {med.prescribedBy}
                    </p>
                  </div>
                </div>
              ))}
              {activeMedications.length === 0 && (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No active medications</p>
                </div>
              )}
              {activeMedications.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setMedicationsPage((prev) => Math.max(1, prev - 1))} disabled={medicationsPage === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {medicationsPage} of {medicationsTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setMedicationsPage((prev) => Math.min(medicationsTotalPages, prev + 1))} disabled={medicationsPage === medicationsTotalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription History</CardTitle>
              <CardDescription>All your prescriptions from doctors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedPrescriptions.map((presc) => (
                <div key={presc._id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{presc.medication}</h3>
                    <p className="text-sm text-muted-foreground">
                      {presc.dosage} - {presc.frequency} for {presc.duration}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prescribed: {new Date(presc.prescribedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(presc.status)}
                </div>
              ))}
              {prescriptions.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No prescriptions found</p>
                </div>
              )}
              {prescriptions.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPrescriptionsPage((prev) => Math.max(1, prev - 1))} disabled={prescriptionsPage === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {prescriptionsPage} of {prescriptionsTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPrescriptionsPage((prev) => Math.min(prescriptionsTotalPages, prev + 1))} disabled={prescriptionsPage === prescriptionsTotalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Allergies</CardTitle>
                  <CardDescription>Known allergies and sensitivities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {paginatedAllergies.map((allergy) => (
                <div key={allergy._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="font-semibold">{allergy.name}</h4>
                    </div>
                    {getSeverityBadge(allergy.severity)}
                  </div>
                  <p className="text-sm text-muted-foreground">Reaction: {allergy.reaction}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorded: {new Date(allergy.recordedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {allergies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No allergies recorded</div>
              )}
              {allergies.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setAllergiesPage((prev) => Math.max(1, prev - 1))} disabled={allergiesPage === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {allergiesPage} of {allergiesTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setAllergiesPage((prev) => Math.min(allergiesTotalPages, prev + 1))} disabled={allergiesPage === allergiesTotalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family History Tab */}
        <TabsContent value="family" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Family Medical History</CardTitle>
                  <CardDescription>Medical conditions in your family</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {paginatedFamilyHistory.map((record) => (
                <div key={record._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <h4 className="font-semibold">{record.relation}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {record.condition} • Age at diagnosis: {record.ageAtDiagnosis || 'Unknown'}
                  </p>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                  )}
                </div>
              ))}
              {familyHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No family history recorded</div>
              )}
              {familyHistory.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setFamilyPage((prev) => Math.max(1, prev - 1))} disabled={familyPage === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {familyPage} of {familyTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setFamilyPage((prev) => Math.min(familyTotalPages, prev + 1))} disabled={familyPage === familyTotalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  Add {formType === 'condition' ? 'Medical Condition' : formType === 'allergy' ? 'Allergy' : 'Family History'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>✕</Button>
              </div>
              
              <form onSubmit={handleAddRecord} className="space-y-4">
                {formType === 'condition' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Condition *</label>
                      <input
                        type="text"
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Diagnosed Date</label>
                      <input
                        type="date"
                        value={formData.diagnosedDate}
                        onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
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
                        <option value="under-treatment">Under Treatment</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {formType === 'allergy' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Allergen *</label>
                      <input
                        type="text"
                        value={formData.allergyName}
                        onChange={(e) => setFormData({ ...formData, allergyName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="e.g., Penicillin, Peanuts"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Severity</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Reaction *</label>
                      <textarea
                        value={formData.reaction}
                        onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        rows={2}
                        placeholder="Describe the reaction"
                        required
                      />
                    </div>
                  </>
                )}

                {formType === 'family' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Relation *</label>
                      <select
                        value={formData.relation}
                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      >
                        <option value="">Select Relation</option>
                        <option>Father</option>
                        <option>Mother</option>
                        <option>Brother</option>
                        <option>Sister</option>
                        <option>Grandfather</option>
                        <option>Grandmother</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Condition *</label>
                      <input
                        type="text"
                        value={formData.familyCondition}
                        onChange={(e) => setFormData({ ...formData, familyCondition: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="e.g., Diabetes, Heart Disease"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Age at Diagnosis</label>
                      <input
                        type="number"
                        value={formData.ageAtDiagnosis}
                        onChange={(e) => setFormData({ ...formData, ageAtDiagnosis: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Age when diagnosed"
                      />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">
                  Add Record
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}