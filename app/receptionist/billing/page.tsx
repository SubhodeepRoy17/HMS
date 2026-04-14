'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { billingApi, receptionApi } from '@/lib/api-client'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Bill {
  _id: string
  billNumber: string
  patientId: string
  patientName: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  status: 'paid' | 'pending' | 'partial' | 'overdue'
  billType?: 'consultation' | 'lab'
  createdAt: string
}

export default function ReceptionistBillingPage() {
  const PAGE_SIZE = 5
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [selectedPatientName, setSelectedPatientName] = useState<string>('')
  const [bills, setBills] = useState<Bill[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
    loadBills()
  }, [selectedPatientId])

  const loadBills = async () => {
    try {
      setIsLoading(true)
      const response = await billingApi.getBills(selectedPatientId || undefined, 'all', undefined, undefined, 1, 200)
      if (response.success && response.data) {
        setBills(response.data as Bill[])
      } else {
        setBills([])
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await receptionApi.searchPatient(searchQuery)
      const patient = response.data?.patientInfo
      if (response.success && patient?.patientId) {
        setSelectedPatientId(patient.patientId)
        setSelectedPatientName(patient.demographics?.fullName || patient.patientId)
        toast.success('Patient selected for billing lookup')
      } else {
        toast.info('Patient not found')
      }
    } catch (error) {
      console.error('Patient search failed:', error)
      toast.error('Failed to search patient')
    } finally {
      setIsSearching(false)
    }
  }

  const pendingBills = useMemo(
    () => bills.filter((bill) => bill.status === 'pending' || bill.status === 'partial' || bill.status === 'overdue'),
    [bills]
  )

  // Show ALL bills (paid, pending, partial, overdue)
  const allBills = useMemo(
    () => bills,
    [bills]
  )

  const pendingAmount = useMemo(
    () => pendingBills.reduce((sum, bill) => sum + (bill.balanceDue || 0), 0),
    [pendingBills]
  )

  // Pagination calculations
  const totalPages = Math.ceil(allBills.length / PAGE_SIZE)
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return allBills.slice(startIndex, endIndex)
  }, [allBills, currentPage])

  const getStatusBadge = (status: Bill['status']) => {
    const cls: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return <Badge className={cls[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Reception Billing</h1>
        <p className="text-muted-foreground mt-2">Search patients and view bill status. Patients complete payments from their own portal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Billing Lookup</CardTitle>
          <CardDescription>Search by patient name, ID, or phone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter patient name, patient ID, or phone"
            />
            <Button onClick={handleSearchPatient} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPatientId('')
                setSelectedPatientName('')
              }}
            >
              Clear
            </Button>
          </div>
          {selectedPatientId && (
            <p className="text-sm text-muted-foreground">
              Showing bills for: <span className="font-medium text-foreground">{selectedPatientName}</span> ({selectedPatientId})
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Bills</CardTitle>
            <p className="text-2xl font-bold">{pendingBills.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Outstanding</CardTitle>
            <p className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Bills Loaded</CardTitle>
            <p className="text-2xl font-bold">{bills.length}</p>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>View all bill statuses (paid, pending, partial, overdue)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allBills.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No bills found</p>
          ) : (
            <>
              {paginatedBills.map((bill) => (
                <div key={bill._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{bill.patientName}</p>
                    <p className="text-sm text-muted-foreground">{bill.billNumber} • {new Date(bill.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Type: {(bill.billType || 'consultation').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">Amount: ₹{bill.totalAmount.toLocaleString()} • Due: ₹{(bill.balanceDue || 0).toLocaleString()}</p>
                  </div>
                  {getStatusBadge(bill.status)}
                </div>
              ))}
              {allBills.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
