'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Microscope, FileText, AlertCircle, CheckCircle2, Lock, Loader2, Search, Plus, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { investigationsApi, receptionApi } from '@/lib/api-client'
import { toast } from 'sonner'

interface TestParameter {
  name: string
  unit: string
  refRange: string
  formula?: string
  resultOptions?: string[]
}

interface TestDefinition {
  id: string
  name: string
  department: string
  parameters: TestParameter[]
}

interface Investigation {
  id: string
  investigationId: string
  patientId: string
  patientName: string
  age: number
  gender: string
  testName: string
  date: string
  status: 'pending' | 'entered' | 'verified' | 'completed'
  results: Record<string, { value: string; abnormal: boolean }>
  previousResults?: Record<string, string>
  verifiedBy?: string
  enteredBy?: string
  department?: string
}

interface PatientSearchResult {
  _id: string
  patientId: string
  demographics: {
    fullName: string
    age: number
    sex: string
    phone: string
  }
}

export default function InvestigationsPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)
  const [patientQuery, setPatientQuery] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [selectedInvestigationForEntry, setSelectedInvestigationForEntry] = useState<string | null>(null)
  const [resultEntryForm, setResultEntryForm] = useState({
    enteredBy: '',
    parameterValues: {} as Record<string, string>,
  })
  const [verificationPasswords, setVerificationPasswords] = useState<Record<string, string>>({})
  const [orderNotes, setOrderNotes] = useState('')

  const testDefinitions: TestDefinition[] = [
    {
      id: 'CBC',
      name: 'Complete Blood Count',
      department: 'Pathology',
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', refRange: 'M: 13.5-17.5, F: 12.0-15.5' },
        { name: 'WBC', unit: 'cells/μL', refRange: '4500-11000' },
        { name: 'RBC', unit: 'million/μL', refRange: 'M: 4.5-5.9, F: 4.1-5.1' },
        { name: 'Platelets', unit: 'thousand/μL', refRange: '150-400' },
      ],
    },
    {
      id: 'LFT',
      name: 'Liver Function Test',
      department: 'Pathology',
      parameters: [
        { name: 'Total Bilirubin', unit: 'mg/dL', refRange: '0.1-1.2' },
        { name: 'SGOT', unit: 'U/L', refRange: '10-40' },
        { name: 'SGPT', unit: 'U/L', refRange: '7-56' },
        { name: 'Alkaline Phosphatase', unit: 'U/L', refRange: '30-120' },
      ],
    },
    {
      id: 'KFT',
      name: 'Kidney Function Test',
      department: 'Pathology',
      parameters: [
        { name: 'Creatinine', unit: 'mg/dL', refRange: 'M: 0.7-1.3, F: 0.6-1.2' },
        { name: 'BUN', unit: 'mg/dL', refRange: '7-20' },
        { name: 'eGFR', unit: 'mL/min/1.73m²', refRange: '>60' },
      ],
    },
    {
      id: 'ECG',
      name: 'ECG',
      department: 'Cardiology',
      parameters: [
        { name: 'Rhythm', unit: 'N/A', refRange: 'Sinus Normal' },
        { name: 'ST Segment', unit: 'N/A', refRange: 'Normal' },
        { name: 'QT Interval', unit: 'ms', refRange: 'M: <450, F: <460' },
      ],
    },
  ]

  const currentTest = useMemo(
    () => testDefinitions.find((test) => test.name === selectedTest) || null,
    [selectedTest]
  )

  useEffect(() => {
    setIsClient(true)
    loadInvestigations()
  }, [])

  const loadInvestigations = async () => {
    try {
      setIsLoading(true)
      const response = await investigationsApi.getInvestigations()
      if (response.success && response.data) {
        const mapped = (response.data as any[]).map((item) => ({
          id: item._id,
          investigationId: item.investigationId,
          patientId: item.patientId,
          patientName: item.patientName,
          age: item.patientAge || 0,
          gender: item.patientGender || 'Other',
          testName: item.testName,
          date: item.requisitionDate ? new Date(item.requisitionDate).toISOString().split('T')[0] : '',
          status: item.status,
          results: (item.parameters || []).reduce((acc: Record<string, { value: string; abnormal: boolean }>, param: any) => {
            acc[param.name] = { value: param.value || '', abnormal: Boolean(param.isAbnormal) }
            return acc
          }, {}),
          verifiedBy: item.verifiedBy,
          enteredBy: item.enteredBy,
          department: item.department,
        }))
        setInvestigations(mapped)
      } else {
        setInvestigations([])
      }
    } catch (error) {
      console.error('Load investigations error:', error)
      toast.error('Failed to load investigations')
    } finally {
      setIsLoading(false)
    }
  }

  const searchPatients = async () => {
    if (!patientQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await receptionApi.searchPatient(patientQuery)
      const patientInfo = response.success ? response.data?.patientInfo : null
      if (patientInfo) {
        setPatientSearchResults([
          {
            _id: patientInfo._id,
            patientId: patientInfo.patientId,
            demographics: patientInfo.demographics,
          },
        ])
      } else {
        setPatientSearchResults([])
        toast.info('No patient found')
      }
    } catch (error) {
      console.error('Search patients error:', error)
      toast.error('Failed to search patients')
    } finally {
      setIsSearching(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      entered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      verified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const isAbnormal = (value: string, refRange: string): boolean => {
    try {
      const numericValue = parseFloat(value)
      if (Number.isNaN(numericValue)) return false
      if (refRange.includes('-')) {
        const [min, max] = refRange.split('-').map((segment) => parseFloat(segment.replace(/[^0-9.]/g, '')))
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          return numericValue < min || numericValue > max
        }
      }
      if (refRange.includes('>')) {
        const min = parseFloat(refRange.replace(/[^0-9.]/g, ''))
        return !Number.isNaN(min) && numericValue < min
      }
      if (refRange.includes('<')) {
        const max = parseFloat(refRange.replace(/[^0-9.]/g, ''))
        return !Number.isNaN(max) && numericValue > max
      }
      return false
    } catch {
      return false
    }
  }

  const handleSaveResults = async (investigation: Investigation) => {
    if (!resultEntryForm.enteredBy) {
      toast.error('Please enter the technician name')
      return
    }

    const transformedParameters = currentTest?.parameters.map((param) => ({
      name: param.name,
      value: resultEntryForm.parameterValues[param.name] || '',
      unit: param.unit,
      referenceRange: param.refRange,
      isAbnormal: isAbnormal(resultEntryForm.parameterValues[param.name] || '', param.refRange),
    })) || []

    const parametersPayload = transformedParameters.reduce((acc: Record<string, string>, param) => {
      acc[param.name] = param.value
      return acc
    }, {})

    try {
      const response = await investigationsApi.enterResults(investigation.investigationId, parametersPayload, resultEntryForm.enteredBy)
      if (response.success) {
        toast.success('Results saved successfully')
        setSelectedInvestigationForEntry(null)
        setResultEntryForm({ enteredBy: '', parameterValues: {} })
        loadInvestigations()
      } else {
        toast.error(response.message || 'Failed to save results')
      }
    } catch (error) {
      console.error('Save results error:', error)
      toast.error('Failed to save results')
    }
  }

  const handleImportFromEquipment = async (investigation: Investigation) => {
    const values: Record<string, string> = {}
    const localTest = testDefinitions.find((test) => test.name === investigation.testName)

    for (const param of localTest?.parameters || []) {
      const rangeMatch = param.refRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
      if (rangeMatch) {
        const min = Number(rangeMatch[1])
        const max = Number(rangeMatch[2])
        const mid = (min + max) / 2
        values[param.name] = String(Number(mid.toFixed(2)))
      } else if (param.refRange.includes('>')) {
        const min = Number(param.refRange.replace(/[^0-9.]/g, ''))
        values[param.name] = String(Number((min + 1).toFixed(2)))
      } else {
        values[param.name] = '1'
      }
    }

    try {
      const response = await investigationsApi.importEquipmentResults(investigation.investigationId, values, 'Simulated Device Feed')
      if (response.success) {
        toast.success('Equipment results imported')
        loadInvestigations()
      } else {
        toast.error(response.message || 'Failed to import equipment results')
      }
    } catch {
      toast.error('Failed to import equipment results')
    }
  }

  const handleVerifyResults = async (investigation: Investigation) => {
    const passcode = verificationPasswords[investigation.investigationId] || ''
    if (!passcode) {
      toast.error('Please enter verification passcode')
      return
    }

    try {
      const response = await investigationsApi.verifyResults(investigation.investigationId, passcode)
      if (response.success) {
        toast.success('Investigation verified successfully')
        setVerificationPasswords({ ...verificationPasswords, [investigation.investigationId]: '' })
        loadInvestigations()
      } else {
        toast.error(response.message || 'Failed to verify results')
      }
    } catch (error) {
      console.error('Verify results error:', error)
      toast.error('Failed to verify results')
    }
  }

  const handleOrderTest = async () => {
    if (!selectedPatient || !currentTest) {
      toast.error('Please select a patient and test')
      return
    }

    try {
      const response = await investigationsApi.orderInvestigation({
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.demographics.fullName,
        patientAge: selectedPatient.demographics.age,
        patientGender: selectedPatient.demographics.sex,
        testName: currentTest.name,
        testCategory: currentTest.department,
        department: currentTest.department,
        clinicalNotes: orderNotes,
      })

      if (response.success) {
        toast.success('Test requisition created')
        setSelectedTest('')
        setSelectedPatient(null)
        setPatientQuery('')
        setPatientSearchResults([])
        setOrderNotes('')
        loadInvestigations()
      } else {
        toast.error(response.message || 'Failed to create requisition')
      }
    } catch (error) {
      console.error('Order test error:', error)
      toast.error('Failed to create requisition')
    }
  }

  if (!isClient || isLoading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const pendingTests = investigations.filter((item) => item.status === 'pending' || item.status === 'entered').length
  const completedTests = investigations.filter((item) => item.status === 'completed').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Investigations & Lab Testing</h1>
        <p className="text-muted-foreground mt-2 text-base">Real lab result entry, validation, and report generation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Total Tests</CardTitle>
                <p className="text-3xl font-bold">{investigations.length}</p>
                <p className="text-xs text-muted-foreground mt-2">All test orders</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Microscope className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Pending Entry</CardTitle>
                <p className="text-3xl font-bold">{pendingTests}</p>
                <p className="text-xs text-muted-foreground mt-2">Results awaiting entry</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground mb-2">Completed</CardTitle>
                <p className="text-3xl font-bold">{completedTests}</p>
                <p className="text-xs text-muted-foreground mt-2">Reports ready</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="pending">Pending Results</TabsTrigger>
          <TabsTrigger value="verify">Verification Queue</TabsTrigger>
          <TabsTrigger value="order">Order Test</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Investigations</CardTitle>
              <CardDescription>Live test history with results and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {investigations.length > 0 ? investigations.map((inv) => (
                <div key={inv.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{inv.patientName} ({inv.testName})</h3>
                      <p className="text-sm text-muted-foreground">{inv.patientId} • Age: {inv.age} • {inv.gender} • {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-2">{getStatusBadge(inv.status)}</div>
                  </div>

                  {Object.keys(inv.results).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(inv.results).map(([param, data]) => (
                        <div key={param} className={`p-2 rounded ${data.abnormal ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'}`}>
                          <p className="font-medium">{param}</p>
                          <p className={data.abnormal ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'}>{data.value || 'Pending'} {data.abnormal ? '⚠️' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {inv.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedInvestigationForEntry(inv.investigationId)}>
                        <Plus className="h-4 w-4 mr-1" /> Enter Results
                      </Button>
                    )}
                    {inv.status === 'entered' && <Badge variant="outline">Ready for verification</Badge>}
                    {inv.status === 'completed' && <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1" /> Print Report</Button>}
                    {inv.enteredBy && <p className="text-xs text-muted-foreground mt-1">Entered by: {inv.enteredBy}</p>}
                    {inv.verifiedBy && <p className="text-xs text-muted-foreground">Verified by: {inv.verifiedBy}</p>}
                  </div>
                </div>
              )) : <p className="text-muted-foreground text-center py-8">No investigations found</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Result Entry Form</CardTitle>
              <CardDescription>Enter test parameters and results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {investigations.filter((inv) => inv.status === 'pending').map((inv) => (
                <div key={inv.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{inv.patientName} - {inv.testName}</h3>
                      <p className="text-sm text-muted-foreground">{inv.patientId} • {inv.date}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedInvestigationForEntry(inv.investigationId)
                      setSelectedTest(inv.testName)
                    }}>Load</Button>
                  </div>

                  {selectedInvestigationForEntry === inv.investigationId && (
                    <>
                      {currentTest?.parameters.map((param) => (
                        <div key={param.name} className="mb-3">
                          <label className="text-sm font-medium">{param.name} ({param.unit})</label>
                          <p className="text-xs text-muted-foreground mb-1">Ref: {param.refRange}</p>
                          <input
                            type="text"
                            placeholder="Enter result"
                            className="w-full px-3 py-2 mt-1 border rounded-md bg-background text-sm"
                            value={resultEntryForm.parameterValues[param.name] || ''}
                            onChange={(e) => setResultEntryForm({
                              ...resultEntryForm,
                              parameterValues: {
                                ...resultEntryForm.parameterValues,
                                [param.name]: e.target.value,
                              },
                            })}
                          />
                        </div>
                      ))}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <input
                          type="text"
                          placeholder="Technician name"
                          value={resultEntryForm.enteredBy}
                          onChange={(e) => setResultEntryForm({ ...resultEntryForm, enteredBy: e.target.value })}
                          className="px-3 py-2 border rounded-md bg-background text-sm"
                        />
                        <Button onClick={() => handleSaveResults(inv)} className="w-full">Save Results</Button>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => handleImportFromEquipment(inv)}>
                        Import From Equipment
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Verification & Approval</CardTitle>
              <CardDescription>Review and verify results before generating final reports. Passcodes are managed in Admin Settings → Security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {investigations.filter((inv) => inv.status === 'entered').map((inv) => (
                <div key={inv.id} className="border rounded-lg p-4 space-y-4 bg-blue-50/30 dark:bg-blue-950/10">
                  <div>
                    <h3 className="font-semibold">{inv.patientName} - {inv.testName}</h3>
                    <p className="text-sm text-muted-foreground">Entered by: {inv.enteredBy} on {inv.date}</p>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(inv.results).map(([param, data]) => (
                      <div key={param} className={`p-3 rounded flex justify-between items-center ${data.abnormal ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700' : 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'}`}>
                        <span className="font-medium">{param}</span>
                        <span>{data.value} {data.abnormal && <span className="text-red-700 dark:text-red-400 ml-2">⚠️ OUT OF RANGE</span>}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter verification passcode"
                      value={verificationPasswords[inv.investigationId] || ''}
                      onChange={(e) => setVerificationPasswords({ ...verificationPasswords, [inv.investigationId]: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                    />
                    <Button size="sm" onClick={() => handleVerifyResults(inv)}>Verify & Approve</Button>
                  </div>
                </div>
              ))}
              {investigations.filter((inv) => inv.status === 'entered').length === 0 && (
                <p className="text-muted-foreground text-center py-8">No tests awaiting verification</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order New Test</CardTitle>
              <CardDescription>Create new test requisition for a patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search Patient</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      placeholder="Search by name, ID, or phone..."
                      className="flex-1 px-3 py-2 border rounded-md bg-background"
                    />
                    <Button type="button" onClick={searchPatients} disabled={isSearching}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {patientSearchResults.length > 0 && (
                  <div className="space-y-2">
                    {patientSearchResults.map((patient) => (
                      <div key={patient._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{patient.demographics.fullName}</p>
                          <p className="text-sm text-muted-foreground">ID: {patient.patientId} • Phone: {patient.demographics.phone}</p>
                        </div>
                        <Button type="button" size="sm" onClick={() => setSelectedPatient(patient)}>Select</Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-semibold">Selected: {selectedPatient.demographics.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.patientId}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Select Test Type *</label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                >
                  <option value="">Choose test</option>
                  {testDefinitions.map((test) => (
                    <option key={test.id} value={test.name}>{test.name} - {test.department}</option>
                  ))}
                </select>
              </div>

              {currentTest && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Test Parameters:</h4>
                  <div className="space-y-2">
                    {currentTest.parameters.map((param) => (
                      <div key={param.name} className="text-sm">
                        <p className="font-medium">{param.name}</p>
                        <p className="text-muted-foreground text-xs">Unit: {param.unit} | Ref Range: {param.refRange}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Clinical Notes / Indications"
                className="w-full px-3 py-2 border rounded-md bg-background h-20"
              />
              <Button className="w-full" onClick={handleOrderTest}>
                <Plus className="h-4 w-4 mr-2" /> Create Test Requisition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
