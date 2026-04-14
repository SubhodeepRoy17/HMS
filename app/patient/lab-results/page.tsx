'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Loader2, Microscope, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { patientApi } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'

interface LabResult {
  _id: string
  investigationId: string
  testName: string
  testCategory: string
  date: string
  status: 'pending' | 'in-progress' | 'entered' | 'verified' | 'completed'
  parameters: {
    name: string
    value: string
    unit: string
    referenceRange: string
    isAbnormal: boolean
    interpretation?: string
    previousValue?: string
  }[]
  reportGeneratedDate?: string
  verifiedBy?: string
}

export default function PatientLabResultsPage() {
  const PAGE_SIZE = 5

  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [allPage, setAllPage] = useState(1)
  const [completedPage, setCompletedPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)

  useEffect(() => {
    setIsClient(true)
    loadLabResults()
  }, [])

  const loadLabResults = async () => {
    try {
      setIsLoading(true)
      const response = await patientApi.getLabResults()
      if (response.success && response.data) {
        setLabResults(response.data)
        setAllPage(1)
        setCompletedPage(1)
        setPendingPage(1)
      } else {
        setLabResults([])
      }
    } catch (error) {
      console.error('Error loading lab results:', error)
      toast.error('Failed to load lab results')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReport = (result: LabResult) => {
    setSelectedResult(result)
    setShowDetailModal(true)
  }

  const handleDownloadReport = async (result: LabResult) => {
    try {
      toast.success(`Downloading ${result.testName} report...`)
      // In production, this would download a PDF
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      entered: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getTrendIcon = (value: string, previousValue?: string) => {
    if (!previousValue) return <Minus className="h-3 w-3 text-gray-400" />
    const current = parseFloat(value)
    const previous = parseFloat(previousValue)
    if (current > previous) return <TrendingUp className="h-3 w-3 text-red-500" />
    if (current < previous) return <TrendingDown className="h-3 w-3 text-green-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const completedResults = labResults.filter(r => r.status === 'completed' || r.status === 'verified')
  const pendingResults = labResults.filter(r => r.status === 'pending' || r.status === 'in-progress' || r.status === 'entered')
  const allTotalPages = Math.max(1, Math.ceil(labResults.length / PAGE_SIZE))
  const completedTotalPages = Math.max(1, Math.ceil(completedResults.length / PAGE_SIZE))
  const pendingTotalPages = Math.max(1, Math.ceil(pendingResults.length / PAGE_SIZE))
  const paginatedAllResults = labResults.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE)
  const paginatedCompletedResults = completedResults.slice((completedPage - 1) * PAGE_SIZE, completedPage * PAGE_SIZE)
  const paginatedPendingResults = pendingResults.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE)

  if (!isClient) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Lab Results</h1>
        <p className="text-muted-foreground mt-2 text-base">View your laboratory test results and reports</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Results ({labResults.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedResults.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingResults.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Lab Results</CardTitle>
              <CardDescription>Your complete laboratory report history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : labResults.length > 0 ? (
                paginatedAllResults.map((lab) => (
                  <div key={lab._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Microscope className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{lab.testName}</h3>
                        {getStatusBadge(lab.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {new Date(lab.date).toLocaleDateString()}
                      </p>
                      {lab.reportGeneratedDate && (
                        <p className="text-sm text-muted-foreground">
                          Reported: {new Date(lab.reportGeneratedDate).toLocaleDateString()}
                        </p>
                      )}
                      {lab.status === 'completed' && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-3">
                            {lab.parameters.slice(0, 2).map((param, idx) => (
                              <span key={idx} className="text-sm">
                                <span className="font-medium">{param.name}:</span>{' '}
                                <span className={param.isAbnormal ? 'text-red-600 font-semibold' : ''}>
                                  {param.value} {param.unit}
                                </span>
                              </span>
                            ))}
                            {lab.parameters.length > 2 && (
                              <span className="text-sm text-muted-foreground">
                                +{lab.parameters.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {lab.status === 'completed' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(lab)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadReport(lab)}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </>
                      )}
                      {lab.status === 'pending' && (
                        <Button size="sm" variant="outline" disabled>
                          Results Pending
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No lab results found</p>
                </div>
              )}
              {labResults.length > PAGE_SIZE && (
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

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Results</CardTitle>
              <CardDescription>Your available test reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedCompletedResults.map((lab) => (
                <div key={lab._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="font-semibold">{lab.testName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completed: {lab.reportGeneratedDate ? new Date(lab.reportGeneratedDate).toLocaleDateString() : new Date(lab.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewReport(lab)}>
                      View Report
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadReport(lab)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {completedResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No completed reports found</div>
              )}
              {completedResults.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setCompletedPage((prev) => Math.max(1, prev - 1))} disabled={completedPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {completedPage} of {completedTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCompletedPage((prev) => Math.min(completedTotalPages, prev + 1))} disabled={completedPage === completedTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Results</CardTitle>
              <CardDescription>Tests awaiting results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedPendingResults.map((lab) => (
                <div key={lab._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="font-semibold">{lab.testName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ordered on {new Date(lab.date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(lab.status)}
                </div>
              ))}
              {pendingResults.length === 0 && (
                <div className="text-center py-8">
                  <Microscope className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No pending tests</p>
                </div>
              )}
              {pendingResults.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPendingPage((prev) => Math.max(1, prev - 1))} disabled={pendingPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {pendingPage} of {pendingTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPendingPage((prev) => Math.min(pendingTotalPages, prev + 1))} disabled={pendingPage === pendingTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-background rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedResult.testName}</h2>
                  <p className="text-muted-foreground">Investigation ID: {selectedResult.investigationId}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>✕</Button>
              </div>

              {/* Report Header */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Test Date</p>
                    <p className="font-semibold">{new Date(selectedResult.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Report Date</p>
                    <p className="font-semibold">
                      {selectedResult.reportGeneratedDate ? new Date(selectedResult.reportGeneratedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified By</p>
                    <p className="font-semibold">{selectedResult.verifiedBy || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {getStatusBadge(selectedResult.status)}
                  </div>
                </div>
              </div>

              {/* Test Parameters Table */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Test Results</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Parameter</th>
                        <th className="text-left p-3 font-semibold text-sm">Result</th>
                        <th className="text-left p-3 font-semibold text-sm">Reference Range</th>
                        <th className="text-left p-3 font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedResult.parameters.map((param, idx) => (
                        <tr key={idx} className={param.isAbnormal ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <td className="p-3 text-sm font-medium">{param.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${param.isAbnormal ? 'text-red-600' : ''}`}>
                                {param.value || 'Pending'} {param.unit}
                              </span>
                              {param.previousValue && getTrendIcon(param.value, param.previousValue)}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{param.referenceRange}</td>
                          <td className="p-3">
                            {param.isAbnormal ? (
                              <Badge className="bg-red-100 text-red-800">Abnormal</Badge>
                            ) : param.value ? (
                              <Badge className="bg-green-100 text-green-800">Normal</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedResult.parameters.some(p => p.interpretation) && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Interpretation</h4>
                    {selectedResult.parameters.map((param, idx) => (
                      param.interpretation && (
                        <p key={idx} className="text-sm">
                          <strong>{param.name}:</strong> {param.interpretation}
                        </p>
                      )
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button className="flex-1" onClick={() => handleDownloadReport(selectedResult)}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF Report
                </Button>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}