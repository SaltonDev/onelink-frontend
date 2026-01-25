'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { deleteTenant, deleteBulkTenants, updateTenant } from '@/app/dashboard/tenants/actions'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Trash2, MoreHorizontal, FileDown, Phone, Mail, CreditCard, Filter, Loader2, Pencil } from "lucide-react" // <--- Added CreditCard
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { jsPDF } from 'jspdf' 
import autoTable from 'jspdf-autotable'

interface Tenant {
  id: string
  name: string
  phone: string
  email: string | null
  national_id: string | null
  status: string
  leases: any[] 
}

export function TenantListClient({ tenants, properties }: { tenants: Tenant[], properties: string[] }) {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL')
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Actions
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.phone.includes(searchQuery)
      // @ts-ignore
      const activeLease = t.leases?.find((l: any) => l.status === 'ACTIVE')
      const propertyName = activeLease?.units?.properties?.name
      
      let matchesProperty = true
      if (propertyFilter !== 'ALL') {
         matchesProperty = propertyName === propertyFilter
      }

      if (filter === 'ACTIVE') return matchesSearch && matchesProperty && t.status === 'ACTIVE'
      if (filter === 'PAST') return matchesSearch && matchesProperty && t.status === 'INACTIVE'
      return matchesSearch && matchesProperty
    })
  }, [tenants, searchQuery, filter, propertyFilter])

  // --- DELETE ACTIONS ---
  async function handleDelete() {
    if (!tenantToDelete) return
    setIsDeleting(true)
    const promise = deleteTenant(tenantToDelete.id)
    toast.promise(promise, {
      loading: 'Deleting tenant...',
      success: (result) => {
        if (result.success) {
          setTenantToDelete(null)
          return 'Tenant deleted successfully'
        } else throw new Error(result.message)
      },
      error: (err) => err.message
    })
    try { await promise } catch (e) {} finally { setIsDeleting(false) }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    const ids = Array.from(selectedIds)
    const promise = deleteBulkTenants(ids)
    toast.promise(promise, {
        loading: `Deleting ${ids.length} tenants...`,
        success: (res) => {
            if(res.success) {
                setSelectedIds(new Set())
                setShowBulkDelete(false)
                return res.message
            } else throw new Error(res.message)
        },
        error: (err) => err.message
    })
    try { await promise } catch(e) {} finally { setIsDeleting(false) }
  }

  // --- EDIT ACTION ---
  async function handleUpdate(formData: FormData) {
    setIsSaving(true)
    const promise = updateTenant(formData)
    toast.promise(promise, {
      loading: 'Updating tenant...',
      success: (result) => {
        if (result.success) {
          setTenantToEdit(null)
          return 'Tenant updated successfully'
        } else throw new Error(result.message)
      },
      error: (err) => err.message
    })
    try { await promise } catch (e) {} finally { setIsSaving(false) }
  }

  // --- PDF EXPORT ---
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text("Tenant Directory", 14, 20)
    doc.setFontSize(10)
    doc.text(`Filter: ${filter} | Property: ${propertyFilter}`, 14, 26)

    const tableData = filteredData.map(t => {
        // @ts-ignore
        const activeLease = t.leases?.find((l: any) => l.status === 'ACTIVE')
        const location = activeLease ? `${activeLease.units?.properties?.name} (${activeLease.units?.unit_number})` : '-'
        return [t.name, t.phone, t.status, location]
    })

    autoTable(doc, { startY: 35, head: [['Name', 'Phone', 'Status', 'Current Location']], body: tableData })
    doc.save('Tenant_List.pdf')
  }

  // --- SELECTION ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredData.map(t => t.id)))
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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
           <div className="flex items-center bg-muted/50 p-1 rounded-lg">
              {['ALL', 'ACTIVE', 'PAST'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === tab ? 'bg-white shadow text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
           <span className="text-xs text-muted-foreground whitespace-nowrap">
              Showing {filteredData.length} of {tenants.length} tenants
           </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.size > 0 && (
             <Button variant="destructive" size="sm" onClick={() => setShowBulkDelete(true)} className="h-9">
               <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedIds.size})
             </Button>
          )}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
             <SelectTrigger className="w-[160px] h-9">
               <div className="flex items-center gap-2 truncate text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 flex-shrink-0" />
                  <SelectValue placeholder="Properties" />
               </div>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="ALL">All Properties</SelectItem>
               {properties.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
             </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={exportPDF}><FileDown className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox checked={filteredData.length>0 && selectedIds.size===filteredData.length} onCheckedChange={toggleSelectAll}/></TableHead>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Current Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No tenants found.</TableCell></TableRow>
            ) : (
               filteredData.map((tenant) => {
                 // @ts-ignore
                 const activeLease = tenant.leases?.find((l: any) => l.status === 'ACTIVE')
                 return (
                   <TableRow key={tenant.id} className="group hover:bg-muted/50">
                     <TableCell><Checkbox checked={selectedIds.has(tenant.id)} onCheckedChange={() => toggleSelectOne(tenant.id)}/></TableCell>
                     <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                              {tenant.name.slice(0,2).toUpperCase()}
                           </div>
                           {tenant.name}
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground gap-1">
                           <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {tenant.phone}</span>
                           {tenant.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {tenant.email}</span>}
                        </div>
                     </TableCell>
                     <TableCell>
                        {activeLease ? (
                           <div className="flex flex-col">
                             <span className="font-medium text-sm">Unit {activeLease.units?.unit_number}</span>
                             <span className="text-xs text-muted-foreground">{activeLease.units?.properties?.name}</span>
                           </div>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                     </TableCell>
                     <TableCell><Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status}</Badge></TableCell>
                     <TableCell className="text-right">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                               {/* ✅ UPDATED: Payment History Link */}
                               <Link href={`/dashboard/tenants/${tenant.id}`}>
                                 <DropdownMenuItem className="cursor-pointer">
                                   <CreditCard className="mr-2 h-4 w-4" /> Payment History
                                 </DropdownMenuItem>
                               </Link>
                               
                               <DropdownMenuItem className="cursor-pointer" onClick={() => setTenantToEdit(tenant)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit Details
                               </DropdownMenuItem>
                               <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => setTenantToDelete(tenant)}><Trash2 className="mr-2 h-4 w-4" /> Delete Tenant</DropdownMenuItem>
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

      {/* EDIT MODAL */}
      <Dialog open={!!tenantToEdit} onOpenChange={(o) => !o && setTenantToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Details</DialogTitle>
          </DialogHeader>
          {tenantToEdit && (
            <form action={handleUpdate} className="space-y-4 mt-2">
              <input type="hidden" name="id" value={tenantToEdit.id} />
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={tenantToEdit.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={tenantToEdit.phone} required />
                </div>
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input name="national_id" defaultValue={tenantToEdit.national_id || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={tenantToEdit.email || ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTenantToEdit(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!tenantToDelete} onOpenChange={(o)=>!o && setTenantToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete {tenantToDelete?.name}?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone. Ensure they have no active leases.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600" disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {/* BULK DELETE CONFIRMATION */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} Tenants?</AlertDialogTitle>
                  <AlertDialogDescription>Irreversible action. If any tenant has active leases, the operation will fail.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600" disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Confirm Delete"}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}