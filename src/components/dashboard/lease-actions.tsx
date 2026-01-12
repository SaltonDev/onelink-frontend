'use client'

import { useState } from 'react'
import { terminateLease, updateLease } from '@/app/dashboard/tenants/actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { toast } from "sonner"
import {
  MoreHorizontal,
  FileText,
  Ban,
  Pencil,
  User,
  Building2,
  Clock,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react"

interface LeaseActionsProps {
  lease: {
    id: string
    unit_id: string
    start_date: string
    end_date: string | null
    rent_amount: number
    status: string
    tenants: {
      name: string
      phone: string
    } | null
    units: {
      unit_number: string
      properties: {
        name: string
      } | null
    } | null
  }
}

export function LeaseActions({ lease }: LeaseActionsProps) {
  // -- STATES --
  const [showDetails, setShowDetails] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const [isTerminating, setIsTerminating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 1. TERMINATE ACTION
  const handleTerminate = async () => {
    setIsTerminating(true)
    
    const promise = terminateLease(lease.id, lease.unit_id)

    toast.promise(promise, {
      loading: 'Terminating lease...',
      success: (res) => {
        if (res.success) {
          setShowTerminate(false)
          return "Lease terminated and tenant removed"
        } else {
          throw new Error(res.message)
        }
      },
      error: (err) => err.message
    })

    try { await promise } catch (e) {} finally { setIsTerminating(false) }
  }

  // 2. UPDATE ACTION
  const handleUpdate = async (formData: FormData) => {
    setIsSaving(true)
    
    const promise = updateLease(formData)

    toast.promise(promise, {
      loading: 'Updating contract...',
      success: (res) => {
        if (res.success) {
          setShowEdit(false)
          return "Contract updated successfully"
        } else {
          throw new Error(res.message)
        }
      },
      error: (err) => err.message
    })

    try { await promise } catch (e) {} finally { setIsSaving(false) }
  }

  // Helper: Calculate Days Remaining
  const daysLeft = !lease.end_date 
    ? 'Indefinite' 
    : Math.ceil((new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  return (
    <>
      {/* --- TRIGGER BUTTON --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => setShowDetails(true)} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" /> View Contract Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowEdit(true)} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" /> Edit Contract
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowTerminate(true)} className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50">
            <Ban className="mr-2 h-4 w-4" /> Terminate Lease
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- DRAWER: CONTRACT DETAILS --- */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-[400px]">
          <SheetHeader className="mb-6">
            <SheetTitle>Contract Overview</SheetTitle>
            <SheetDescription>
              Current lease terms for {lease.tenants?.name}.
            </SheetDescription>
          </SheetHeader>

          {/* LEASE DETAILS CARD */}
          <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 space-y-5 shadow-sm">
            
            {/* Header: Tenant & Status */}
            <div className="flex items-start justify-between">
               <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    {lease.tenants?.name}
                  </h3>
                  <p className="text-xs text-slate-500">{lease.tenants?.phone}</p>
               </div>
               <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'}>
                 {lease.status}
               </Badge>
            </div>
            
            {/* Grid Info */}
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                 <span className="text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Property</span>
                 <span className="font-medium">{lease.units?.properties?.name || 'Main Building'}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                 <span className="text-slate-500 flex items-center gap-2"><Building2 className="h-4 w-4" /> Unit Number</span>
                 <span className="font-medium">{lease.units?.unit_number}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                 <span className="text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Start Date</span>
                 <span className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                 <span className="text-slate-500 flex items-center gap-2"><Clock className="h-4 w-4" /> End Date</span>
                 <span className={`font-medium ${typeof daysLeft === 'number' && daysLeft < 30 ? 'text-orange-600' : ''}`}>
                   {lease.end_date ? new Date(lease.end_date).toLocaleDateString() : 'Indefinite'}
                 </span>
              </div>
              
              {typeof daysLeft === 'number' && daysLeft < 30 && (
                <div className="bg-orange-50 text-orange-700 text-xs p-2 rounded flex items-center gap-2">
                   <Clock className="h-3 w-3" /> 
                   <strong>Expiring Soon:</strong> {daysLeft} days remaining.
                </div>
              )}
            </div>

            {/* Footer: Rent */}
            <div className="bg-white dark:bg-black p-3 rounded border flex justify-between items-center">
               <span className="text-xs text-slate-500 uppercase font-bold">Monthly Rent</span>
               <span className="font-mono font-bold text-lg text-green-600">
                 {Number(lease.rent_amount).toLocaleString()} <span className="text-xs text-gray-400">RWF</span>
               </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- EDIT MODAL --- */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contract Terms</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 mt-2">
            <input type="hidden" name="id" value={lease.id} />
            
            <div className="space-y-2">
              <Label>Rent Amount (RWF)</Label>
              <MoneyInput name="rent_amount" defaultValue={lease.rent_amount} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input name="start_date" type="date" defaultValue={lease.start_date} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input name="end_date" type="date" defaultValue={lease.end_date || ""} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- TERMINATE ALERT --- */}
      <AlertDialog open={showTerminate} onOpenChange={setShowTerminate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Lease & Move Out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete</strong> this tenant, their contract, and all history.
              The unit <strong>{lease.units?.unit_number}</strong> will become VACANT.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTerminating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTerminate} className="bg-red-600 hover:bg-red-700 text-white" disabled={isTerminating}>
              {isTerminating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm Move Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}