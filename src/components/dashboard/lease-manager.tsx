'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { terminateBulkLeases } from '@/app/dashboard/tenants/actions'
import { LeaseActions } from './lease-actions'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner" // <--- NEW: Import directly from sonner
import { 
  Loader2, 
  Ban, 
  User, 
  Home, 
  AlertTriangle 
} from "lucide-react"
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

interface LeaseManagerProps {
  leases: any[]
}

export function LeaseManager({ leases }: LeaseManagerProps) {
  const router = useRouter()
  // No need for const { toast } = useToast() anymore!
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isTerminating, setIsTerminating] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const activeLeases = leases.filter(l => l.status === 'ACTIVE')

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === activeLeases.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(activeLeases.map(l => l.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // --- BULK ACTION LOGIC ---
  const handleBulkTerminate = async () => {
    setIsTerminating(true)
    
    // Show a loading toast that we can update later
    const toastId = toast.loading("Processing terminations...")

    try {
      await terminateBulkLeases(selectedIds)
      
      // Update toast to Success
      toast.success("Contracts Terminated", {
        id: toastId, // Updates the loading toast
        description: `Successfully terminated ${selectedIds.length} leases.`,
      })

      setSelectedIds([]) 
      setShowBulkConfirm(false)
      router.refresh()
      
    } catch (error) {
      // Update toast to Error
      toast.error("Termination Failed", {
        id: toastId,
        description: "Could not terminate contracts. Please check the logs.",
      })
    } finally {
      setIsTerminating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {activeLeases.length} Active Contracts
          </Badge>
          
          {selectedIds.length > 0 && (
            <span className="text-sm text-blue-600 font-medium ml-2 animate-in fade-in">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div>
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowBulkConfirm(true)}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              <Ban className="mr-2 h-4 w-4" />
              Terminate Selected
            </Button>
          )}
        </div>
      </div>

      {/* --- TABLE --- */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="p-4 w-[50px]">
                    <Checkbox 
                      checked={activeLeases.length > 0 && selectedIds.length === activeLeases.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 font-medium text-gray-500">Tenant</th>
                  <th className="p-4 font-medium text-gray-500">Unit</th>
                  <th className="p-4 font-medium text-gray-500">Rent</th>
                  <th className="p-4 font-medium text-gray-500">Status</th>
                  <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {activeLeases.map((lease) => (
                  <tr key={lease.id} className={`transition-colors ${selectedIds.includes(lease.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedIds.includes(lease.id)}
                        onCheckedChange={() => toggleSelectOne(lease.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         <div className="bg-slate-100 p-1.5 rounded-full">
                           <User className="h-4 w-4 text-slate-500" />
                         </div>
                         <div>
                           <div className="font-bold">{lease.tenants?.name}</div>
                           <div className="text-xs text-gray-500">{lease.tenants?.phone}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span className="font-mono">{lease.units?.unit_number}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      {Number(lease.rent_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                        {lease.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                       <LeaseActions lease={lease} />
                    </td>
                  </tr>
                ))}
                {activeLeases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No active contracts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- CONFIRMATION MODAL --- */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Mass Termination Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to terminate <strong>{selectedIds.length} active contracts</strong>.
              </p>
              <div className="bg-red-50 p-3 rounded-md border border-red-100 text-red-800 text-xs">
                <strong>This action is irreversible:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Units will become VACANT immediately.</li>
                  <li>Leases and Tenants will be permanently deleted.</li>
                  <li>Invoices & Payment History will be wiped.</li>
                </ul>
              </div>
              <p>Are you absolutely sure?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTerminating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleBulkTerminate()
              }} 
              disabled={isTerminating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isTerminating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Terminating...
                </>
              ) : (
                "Yes, Delete Everything"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}