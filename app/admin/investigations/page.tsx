'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Microscope, FileText, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

export default function InvestigationsPage() {
  const [isClient, setIsClient] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string>('')
  const [investigations, setInvestigations] = useState<Investigation[]>([
    {
      id: 'INV001',
      patientId: 'PID-2024-001',
      patientName: 'Alice Brown',
      age: 35,
      gender: 'Female',
      testName: 'Complete Blood Count',
      date: '2024-03-25',
      status: 'completed',
      results: {
        'Hemoglobin': { value: '13.5', abnormal: false },
        'WBC': { value: '7500', abnormal: false },
        'Platelets': { value: '250000', abnormal: false }
      },
      previousResults: { 'Hemoglobin': '13.2', 'WBC': '7200' },
      verifiedBy: 'Dr. Lab Manager'
    },
    {
      id: 'INV002',
      patientId: 'PID-2024-002',
      patientName: 'David Wilson',
      age: 48,
      gender: 'Male',
      testName: 'Liver Function Test',
      date: '2024-03-24',
      status: 'entered',
      results: {
        'Total Bilirubin': { value: '0.9', abnormal: false },
        'SGOT': { value: '45', abnormal: true },
        'SGPT': { value: '52', abnormal: true }
      },
      enteredBy: 'Lab Technician 1'
    },
  ])

  const [resultEntryForm, setResultEntryForm] = useState({
    investigationId: '',
    parameterValues: {} as Record<string, string>,
    enteredBy: '',
    verificationPassword: ''
  })

  const testDefinitions: TestDefinition[] = [
    {
      id: 'TEST001',
      name: 'Complete Blood Count',
      department: 'Pathology',
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', refRange: 'M: 13.5-17.5, F: 12.0-15.5', resultOptions: ['Normal', 'Low', 'High', 'Critically Low', 'Critically High'] },
        { name: 'WBC', unit: 'cells/μL', refRange: '4500-11000', resultOptions: ['Normal', 'Low', 'High', 'Severely Low', 'Severely High'] },
        { name: 'RBC', unit: 'million/μL', refRange: 'M: 4.5-5.9, F: 4.1-5.1', resultOptions: ['Normal', 'Low', 'High', 'Critical Low', 'Critical High'] },
        { name: 'Platelets', unit: 'thousand/μL', refRange: '150-400', resultOptions: ['Normal', 'Low Thrombocytes', 'High Thrombocytes', 'Severe Deficiency', 'Severe Elevation'] }
      ]
    },
    {
      id: 'TEST002',
      name: 'Liver Function Test',
      department: 'Pathology',
      parameters: [
        { name: 'Total Bilirubin', unit: 'mg/dL', refRange: '0.1-1.2', resultOptions: ['Normal', 'Mildly Elevated', 'Moderately Elevated', 'Severely Elevated', 'Critical Level'] },
        { name: 'SGOT', unit: 'U/L', refRange: '10-40', resultOptions: ['Normal', 'Slightly Elevated', 'Moderately Elevated', 'Significantly Elevated', 'Critical'] },
        { name: 'SGPT', unit: 'U/L', refRange: '7-56', resultOptions: ['Normal', 'Slightly Elevated', 'Moderately Elevated', 'Significantly Elevated', 'Critical'] },
        { name: 'Alkaline Phosphatase', unit: 'U/L', refRange: '30-120', formula: 'Calculated from liver enzymes' }
      ]
    },
    {
      id: 'TEST003',
      name: 'Kidney Function Test',
      department: 'Pathology',
      parameters: [
        { name: 'Creatinine', unit: 'mg/dL', refRange: 'M: 0.7-1.3, F: 0.6-1.2', resultOptions: ['Normal', 'Slightly Elevated', 'Moderately Elevated', 'Severely Elevated', 'Critical'] },
        { name: 'BUN', unit: 'mg/dL', refRange: '7-20', resultOptions: ['Normal', 'Mildly Elevated', 'Moderately Elevated', 'Significantly Elevated', 'Critical Level'] },
        { name: 'eGFR', unit: 'mL/min/1.73m²', refRange: '>60', formula: 'Calculated from Creatinine and Age' }
      ]
    },
    {
      id: 'TEST004',
      name: 'ECG',
      department: 'Cardiology',
      parameters: [
        { name: 'Rhythm', unit: 'N/A', refRange: 'Sinus Normal', resultOptions: ['Normal Sinus', 'Atrial Fibrillation', 'Arrhythmia', 'Bradycardia', 'Tachycardia'] },
        { name: 'ST Segment', unit: 'N/A', refRange: 'Normal', resultOptions: ['Normal', 'Depression', 'Elevation', 'T Wave Inversion', 'Critical Changes'] },
        { name: 'QT Interval', unit: 'ms', refRange: 'M: <450, F: <460', resultOptions: ['Normal', 'Prolonged', 'Shortened', 'Borderline', 'Critical'] }
      ]
    }
  ]

  const departmentPasscodes = {
    'Pathology': 'LAB2024',
    'Cardiology': 'CARDIO2024',
    'Radiology': 'RAD2024'
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'entered': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'verified': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const isAbnormal = (value: string, refRange: string): boolean => {
    try {
      const numValue = parseFloat(value)
      if (refRange.includes('-')) {
        const [min, max] = refRange.split('-').map(v => parseFloat(v.trim()))
        return isNaN(numValue) ? false : numValue < min || numValue > max
      }
      return false
    } catch {
      return false
    }
  }

  const handleAddResultEntry = (investigationId: string) => {
    setResultEntryForm({ ...resultEntryForm, investigationId })
  }

  const handleSaveResults = () => {
    if (!resultEntryForm.investigationId || !resultEntryForm.enteredBy) {
      alert('Please fill in required fields')
      return
    }

    const currentInv = investigations.find(inv => inv.id === resultEntryForm.investigationId)
    const testDef = testDefinitions.find(t => t.name === currentInv?.testName)
    
    const transformedResults: Record<string, { value: string; abnormal: boolean }> = {}
    Object.entries(resultEntryForm.parameterValues).forEach(([key, value]) => {
      const param = testDef?.parameters.find(p => p.name === key)
      transformedResults[key] = {
        value: value,
        abnormal: param ? isAbnormal(value, param.refRange) : false
      }
    })

    const updatedInvestigations = investigations.map(inv => {
      if (inv.id === resultEntryForm.investigationId) {
        return {
          ...inv,
          status: 'entered' as const,
          results: transformedResults,
          enteredBy: resultEntryForm.enteredBy
        }
      }
      return inv
    })
    setInvestigations(updatedInvestigations)
    setResultEntryForm({ investigationId: '', parameterValues: {}, enteredBy: '', verificationPassword: '' })
  }

  const handleVerifyResults = (investigationId: string, passcode: string) => {
    if (passcode !== 'LAB2024' && passcode !== 'CARDIO2024' && passcode !== 'RAD2024') {
      alert('Invalid verification passcode')
      return
    }

    const updatedInvestigations = investigations.map(inv => {
      if (inv.id === investigationId) {
        return {
          ...inv,
          status: 'completed' as const,
          verifiedBy: 'Authorized Reviewer'
        }
      }
      return inv
    })
    setInvestigations(updatedInvestigations)
  }

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  const pendingTests = investigations.filter(inv => inv.status === 'pending' || inv.status === 'entered').length
  const completedTests = investigations.filter(inv => inv.status === 'completed').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Investigations & Lab Testing</h1>
        <p className="text-muted-foreground mt-2 text-base">Advanced lab result entry, validation, and automated reporting with role-based access</p>
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
                <p className="text-xs text-muted-foreground mt-2">Reports ready for print</p>
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

        {/* All Tests Tab */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Investigations</CardTitle>
              <CardDescription>Complete test history with results and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {investigations.map((inv) => (
                <div key={inv.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{inv.patientName} ({inv.testName})</h3>
                      <p className="text-sm text-muted-foreground">{inv.patientId} • Age: {inv.age} • {inv.gender} • {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inv.status)}
                    </div>
                  </div>

                  {inv.results && Object.keys(inv.results).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(inv.results).map(([param, data]) => (
                        <div key={param} className={`p-2 rounded ${data.abnormal ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'}`}>
                          <p className="font-medium">{param}</p>
                          <p className={data.abnormal ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'}>
                            {data.value} {data.abnormal && '⚠️'}
                          </p>
                          {inv.previousResults?.[param] && (
                            <p className="text-xs text-muted-foreground mt-1">Previous: {inv.previousResults[param]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {inv.status === 'entered' && <Button size="sm" variant="outline">Review</Button>}
                    {inv.status === 'completed' && <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1" />Print Report</Button>}
                    {inv.enteredBy && <p className="text-xs text-muted-foreground mt-1">Entered by: {inv.enteredBy}</p>}
                    {inv.verifiedBy && <p className="text-xs text-muted-foreground">Verified by: {inv.verifiedBy}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Results Tab */}
        <TabsContent value="pending" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Result Entry Form</CardTitle>
              <CardDescription>Enter test parameters and results with automated abnormal detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {investigations
                .filter(inv => inv.status === 'pending')
                .map((inv) => (
                  <div key={inv.id} className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{inv.patientName} - {inv.testName}</h3>
                      
                      {testDefinitions.find(t => t.name === inv.testName)?.parameters.map((param) => (
                        <div key={param.name} className="mb-3">
                          <label className="text-sm font-medium">{param.name} ({param.unit})</label>
                          <p className="text-xs text-muted-foreground mb-1">Ref: {param.refRange}</p>
                          {param.resultOptions ? (
                            <select 
                              className="w-full px-3 py-2 mt-1 border rounded-md bg-background text-sm"
                              onChange={(e) => {
                                const value = e.target.value
                                setResultEntryForm({
                                  ...resultEntryForm,
                                  parameterValues: {
                                    ...resultEntryForm.parameterValues,
                                    [param.name]: value
                                  }
                                })
                              }}
                            >
                              <option value="">Select Result</option>
                              {param.resultOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="number"
                              placeholder="Enter numeric value"
                              className="w-full px-3 py-2 mt-1 border rounded-md bg-background text-sm"
                              onChange={(e) => {
                                setResultEntryForm({
                                  ...resultEntryForm,
                                  parameterValues: {
                                    ...resultEntryForm.parameterValues,
                                    [param.name]: e.target.value
                                  }
                                })
                              }}
                            />
                          )}
                          {param.formula && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">📐 {param.formula}</p>}
                        </div>
                      ))}

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <input 
                          type="text"
                          placeholder="Your name (Technician)"
                          value={resultEntryForm.enteredBy}
                          onChange={(e) => setResultEntryForm({ ...resultEntryForm, enteredBy: e.target.value })}
                          className="px-3 py-2 border rounded-md bg-background text-sm"
                        />
                        <Button 
                          onClick={handleSaveResults}
                          className="w-full"
                        >
                          Save Results - Ready for Verification
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Queue Tab */}
        <TabsContent value="verify" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                2-Step Verification & Approval
              </CardTitle>
              <CardDescription>Review and verify results before generating final reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {investigations
                .filter(inv => inv.status === 'entered')
                .map((inv) => (
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
                        id={`verify-${inv.id}`}
                        className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          const passcode = (document.getElementById(`verify-${inv.id}`) as HTMLInputElement).value
                          handleVerifyResults(inv.id, passcode)
                        }}
                      >
                        Verify & Approve
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Role-based verification required. Department passcodes configured.</p>
                  </div>
                ))
              }
              {investigations.filter(inv => inv.status === 'entered').length === 0 && (
                <p className="text-muted-foreground text-center py-8">No tests awaiting verification</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Test Tab */}
        <TabsContent value="order" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order New Test</CardTitle>
              <CardDescription>Create new test requisition with test parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Patient Name" className="px-3 py-2 border rounded-md bg-background" />
                <input type="text" placeholder="Patient ID" className="px-3 py-2 border rounded-md bg-background" />
                <input type="number" placeholder="Age" className="px-3 py-2 border rounded-md bg-background" />
                <select className="px-3 py-2 border rounded-md bg-background">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Select Test Type *</label>
                <select 
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-3 py-2 mt-2 border rounded-md bg-background"
                >
                  <option value="">Choose test</option>
                  {testDefinitions.map(test => (
                    <option key={test.id} value={test.name}>{test.name} - {test.department}</option>
                  ))}
                </select>
              </div>

              {selectedTest && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Test Parameters:</h4>
                  <div className="space-y-2">
                    {testDefinitions
                      .find(t => t.name === selectedTest)
                      ?.parameters.map(param => (
                        <div key={param.name} className="text-sm">
                          <p className="font-medium">{param.name}</p>
                          <p className="text-muted-foreground text-xs">Unit: {param.unit} | Ref Range: {param.refRange}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <textarea placeholder="Clinical Notes / Indications" className="w-full px-3 py-2 border rounded-md bg-background h-20" />
              <Button className="w-full">Create Test Requisition</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
