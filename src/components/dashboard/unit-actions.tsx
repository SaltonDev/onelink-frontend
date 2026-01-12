'use client'

import { useState } from 'react'
import { updateUnit, deleteUnit } from '@/app/dashboard/properties/actions'
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select" 
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner" // <--- IMPORT TOAST

interface UnitActionsProps {
  unit: {
    id: string
    unit_number: string
    floor_number: string | null
    rent_amount: number
    status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' 
    property_id: string
  }
}

export function UnitActions({ unit }: UnitActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // HANDLE UPDATE
  async function handleUpdate(formData: FormData) {
    setIsLoading(true)
    
    // We use toast.promise to handle the server action result
    const promise = updateUnit(formData)

    toast.promise(promise, {
      loading: 'Updating unit...',
      success: (result) => {
        if (result.success) {
          setShowEditModal(false)
          return 'Unit updated successfully'
        } else {
          throw new Error(result.message || 'Failed to update')
        }
      },
      error: (err) => {
        return err.message || 'An error occurred'
      }
    })

    try {
      await promise
    } catch (e) {
      // Error handled by toast
    } finally {
      setIsLoading(false)
    }
  }

  // HANDLE DELETE
  async function handleDelete() {
    setIsLoading(true)
    
    const promise = deleteUnit(unit.id, unit.property_id)

    toast.promise(promise, {
      loading: 'Deleting unit...',
      success: (result) => {
        if (result.success) {
          setShowDeleteModal(false)
          return 'Unit deleted successfully'
        } else {
          throw new Error(result.message || 'Failed to delete')
        }
      },
      error: (err) => {
        return err.message || 'An error occurred'
      }
    })

    try {
      await promise
    } catch (e) {
      // Error handled by toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem 
            onSelect={(e) => { e.preventDefault(); setShowEditModal(true) }}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit Unit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => { e.preventDefault(); setShowDeleteModal(true) }}
            className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Unit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- EDIT MODAL --- */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit {unit.unit_number}</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 mt-2">
            <input type="hidden" name="id" value={unit.id} />
            <input type="hidden" name="property_id" value={unit.property_id} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Number</Label>
                <Input name="unit_number" defaultValue={unit.unit_number} required />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input name="floor_number" defaultValue={unit.floor_number || ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Standard Rent (RWF)</Label>
              <MoneyInput 
                name="rent_amount" 
                defaultValue={unit.rent_amount} 
                required 
              />
            </div>

            {/* STATUS SELECT LOGIC */}
            <div className="space-y-2">
              <Label>Unit Status</Label>
              
              {unit.status === 'OCCUPIED' ? (
                // 1. IF OCCUPIED: Read-only message
                <div className="p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-100 text-sm flex items-center">
                  <span className="font-medium mr-2">Status: Occupied</span>
                  <span className="text-xs opacity-75">(Manage lease to change)</span>
                  {/* Hidden input to ensure status is preserved if needed */}
                  <input type="hidden" name="status" value="OCCUPIED" />
                </div>
              ) : (
                // 2. IF VACANT/MAINTENANCE: Show Select Box
                <Select name="status" defaultValue={unit.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VACANT">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Ready to Rent (Vacant)
                      </span>
                    </SelectItem>
                    <SelectItem value="MAINTENANCE">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
                        Under Maintenance
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE ALERT --- */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>Unit {unit.unit_number}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Unit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}