'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { terminateLease, terminateBulkLeases, updateLease } from '@/app/dashboard/tenants/actions'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MoreHorizontal, FileDown, Calendar, Home, AlertTriangle, Trash2, FileText, Filter, Loader2, Pencil } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoneyInput } from "@/components/ui/money-input"
import { toast } from "sonner"

// IMPORT THE NEW GENERATOR
import { generateLeaseListPDF } from '@/utils/lease-list-generator'

interface LeaseListProps {
  leases: any[]
  properties: string[]
  type?: 'ACTIVE' | 'EXPIRING'
}

export function LeaseListClient({ leases, properties, type = 'ACTIVE' }: LeaseListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Actions State
  const [leaseToTerminate, setLeaseToTerminate] = useState<any>(null)
  const [leaseToEdit, setLeaseToEdit] = useState<any>(null)
  const [showBulkTerminate, setShowBulkTerminate] = useState(false)
  const [viewLease, setViewLease] = useState<any>(null)
  
  // Loading States
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return leases.filter(l => {
      const searchLower = searchQuery.toLowerCase()
      const tenantName = l.tenants?.name?.toLowerCase() || ''
      const unitNum = l.units?.unit_number?.toLowerCase() || ''
      const matchesSearch = tenantName.includes(searchLower) || unitNum.includes(searchLower)

      const propertyName = l.units?.properties?.name || ''
      const matchesProperty = propertyFilter === 'ALL' || propertyName === propertyFilter

      return matchesSearch && matchesProperty
    })
  }, [leases, searchQuery, propertyFilter])

  // --- ACTIONS: UPDATE LEASE ---
  async function handleUpdate(formData: FormData) {
    setIsSaving(true)
    const promise = updateLease(formData)
    
    toast.promise(promise, {
      loading: 'Updating contract...',
      success: (res) => {
        if (res.success) {
          setLeaseToEdit(null)
          return "Contract updated successfully"
        } else throw new Error(res.message)
      },
      error: (err) => err.message
    })
    
    try { await promise } catch (e) {} finally { setIsSaving(false) }
  }

  // --- ACTIONS: SINGLE TERMINATE ---
  async function handleTerminate() {
    if (!leaseToTerminate) return
    setIsProcessing(true)
    const promise = terminateLease(leaseToTerminate.id, leaseToTerminate.unit_id)
    
    toast.promise(promise, {
      loading: 'Terminating lease...',
      success: (res) => {
        if(res.success) {
            setLeaseToTerminate(null)
            return "Lease terminated and tenant removed"
        } else throw new Error(res.message)
      },
      error: (err) => err.message
    })
    try { await promise } catch (e) {} finally { setIsProcessing(false) }
  }

  // --- ACTIONS: BULK TERMINATE ---
  async function handleBulkTerminate() {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const ids = Array.from(selectedIds)
    const promise = terminateBulkLeases(ids)

    toast.promise(promise, {
        loading: `Terminating ${ids.length} leases...`,
        success: (res) => {
            if(res.success) {
                setSelectedIds(new Set())
                setShowBulkTerminate(false)
                return res.message
            } else throw new Error(res.message)
        },
        error: (err) => err.message
    })
    try { await promise } catch(e) {} finally { setIsProcessing(false) }
  }

  // --- PDF EXPORT ---
  const handleExportPDF = () => {
    generateLeaseListPDF({
        leases: filteredData,
        filterContext: {
            property: propertyFilter,
            type: type
        }
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredData.map(l => l.id)))
  }

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap min-w-[120px]">
             Showing {filteredData.length} of {leases.length}
          </span>
          <div className="flex items-center gap-2 w-full">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search tenant or unit..." className="pl-9 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
             <Select value={propertyFilter} onValueChange={setPropertyFilter}>
               <SelectTrigger className="w-[180px] h-9">
                 <div className="flex items-center gap-2 truncate text-muted-foreground">
                    <Filter className="h-3.5 w-3.5 flex-shrink-0" />
                    <SelectValue placeholder="All Properties" />
                 </div>
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="ALL">All Properties</SelectItem>
                 {properties.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setShowBulkTerminate(true)} className="h-9">
                <Trash2 className="h-4 w-4 mr-2" /> Terminate ({selectedIds.size})
              </Button>
           )}
           <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9">
             <FileDown className="h-4 w-4 mr-2" /> PDF
           </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox checked={filteredData.length > 0 && selectedIds.size === filteredData.length} onCheckedChange={toggleSelectAll}/></TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Property & Unit</TableHead>
              <TableHead>Contract Duration</TableHead>
              <TableHead>Rent Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No leases found.</TableCell></TableRow>
            ) : (
              filteredData.map((lease) => {
                const endDate = lease.end_date ? new Date(lease.end_date) : null
                const isExpiring = endDate && (endDate.getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000)

                return (
                  <TableRow key={lease.id} className="group hover:bg-muted/50">
                    <TableCell><Checkbox checked={selectedIds.has(lease.id)} onCheckedChange={() => toggleSelectOne(lease.id)}/></TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                             {lease.tenants?.name?.slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-medium text-sm">{lease.tenants?.name}</span>
                             <span className="text-xs text-muted-foreground">{lease.tenants?.phone}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                             <span className="font-medium text-sm">{lease.units?.unit_number}</span>
                             <span className="text-xs text-muted-foreground">{lease.units?.properties?.name}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col text-sm">
                          <div className="flex items-center gap-1.5">
                             <Calendar className="h-3 w-3 text-muted-foreground" />
                             {/* FIX: Force Date Format dd/mm/yyyy */}
                             <span>{new Date(lease.start_date).toLocaleDateString('en-GB')}</span>
                             <span className="text-muted-foreground">→</span>
                             <span className={`${isExpiring ? 'text-orange-600 font-medium' : ''}`}>
                               {lease.end_date ? new Date(lease.end_date).toLocaleDateString('en-GB') : 'Indefinite'}
                             </span>
                          </div>
                          {isExpiring && type === 'EXPIRING' && (
                             <span className="text-xs text-orange-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> Ends soon</span>
                          )}
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="font-mono font-medium">{Number(lease.rent_amount).toLocaleString()} RWF</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem className="cursor-pointer" onClick={() => setViewLease(lease)}>
                                <FileText className="mr-2 h-4 w-4" /> View Contract
                             </DropdownMenuItem>
                             <DropdownMenuItem className="cursor-pointer" onClick={() => setLeaseToEdit(lease)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Contract
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => setLeaseToTerminate(lease)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Terminate Lease
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* DRAWER: VIEW CONTRACT */}
      <Sheet open={!!viewLease} onOpenChange={(o) => !o && setViewLease(null)}>
         <SheetContent>
            <SheetHeader>
               <SheetTitle>Contract Details</SheetTitle>
               <SheetDescription>Active lease for <strong>{viewLease?.units?.unit_number}</strong></SheetDescription>
            </SheetHeader>
            {viewLease && (
               <div className="mt-6 space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{viewLease.tenants?.name.slice(0,2).toUpperCase()}</div>
                         <div>
                            <div className="font-bold">{viewLease.tenants?.name}</div>
                            <div className="text-xs text-muted-foreground">{viewLease.tenants?.phone}</div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                         <div><div className="text-xs text-muted-foreground mb-1">Property</div><div className="font-medium">{viewLease.units?.properties?.name}</div></div>
                         <div><div className="text-xs text-muted-foreground mb-1">Unit</div><div className="font-medium">{viewLease.units?.unit_number}</div></div>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {/* FIX: Force Date Format dd/mm/yyyy */}
                      <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Start Date</span><span className="font-medium">{new Date(viewLease.start_date).toLocaleDateString('en-GB')}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">End Date</span><span className="font-medium">{viewLease.end_date ? new Date(viewLease.end_date).toLocaleDateString('en-GB') : 'Indefinite'}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Monthly Rent</span><span className="font-mono font-bold text-green-600">{Number(viewLease.rent_amount).toLocaleString()} RWF</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Status</span><Badge>{viewLease.status}</Badge></div>
                  </div>
                  <div className="pt-4"><Button variant="outline" className="w-full" asChild><Link href={`/dashboard/tenants/${viewLease.tenant_id}`}>View Payment History</Link></Button></div>
               </div>
            )}
         </SheetContent>
      </Sheet>

      {/* EDIT MODAL */}
      <Dialog open={!!leaseToEdit} onOpenChange={(o) => !o && setLeaseToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contract Terms</DialogTitle>
          </DialogHeader>
          {leaseToEdit && (
            <form action={handleUpdate} className="space-y-4 mt-2">
              <input type="hidden" name="id" value={leaseToEdit.id} />
              
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md text-sm">
                 <div>
                    <span className="text-xs text-muted-foreground">Tenant</span>
                    <div className="font-medium">{leaseToEdit.tenants?.name}</div>
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Unit</span>
                    <div className="font-medium">{leaseToEdit.units?.unit_number}</div>
                 </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Rent (RWF)</Label>
                <MoneyInput name="rent_amount" defaultValue={leaseToEdit.rent_amount} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input name="start_date" type="date" defaultValue={leaseToEdit.start_date} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input name="end_date" type="date" defaultValue={leaseToEdit.end_date || ""} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLeaseToEdit(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* TERMINATE ALERTS */}
      <AlertDialog open={!!leaseToTerminate} onOpenChange={(o) => !o && setLeaseToTerminate(null)}>
         <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Terminate Lease?</AlertDialogTitle><AlertDialogDescription>This will end the contract immediately. The unit will be marked as VACANT.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleTerminate} className="bg-red-600" disabled={isProcessing}>{isProcessing ? "Processing..." : "Confirm"}</AlertDialogAction></AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkTerminate} onOpenChange={setShowBulkTerminate}>
         <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Terminate {selectedIds.size} Leases?</AlertDialogTitle><AlertDialogDescription>This will end contracts and free up units for all selected tenants.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkTerminate} className="bg-red-600" disabled={isProcessing}>{isProcessing ? "Processing..." : "Confirm"}</AlertDialogAction></AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}