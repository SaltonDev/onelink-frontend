'use client'

import { useState } from 'react'
import { deleteProperty, updateProperty } from '@/app/dashboard/properties/actions'
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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Pencil, Trash2, Settings, Loader2 } from "lucide-react"
import Link from 'next/link'
import { toast } from "sonner" // Ensure sonner is installed

interface PropertyActionsProps {
  property: {
    id: string
    name: string
    address: string | null
  }
}

export function PropertyActions({ property }: PropertyActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Wrapper for Update
  async function handleUpdate(formData: FormData) {
    setIsUpdating(true)
    
    const result = await updateProperty(formData)

    if (result.success) {
      toast.success(result.message)
      setShowEditModal(false)
    } else {
      toast.error(result.message)
    }
    
    setIsUpdating(false)
  }

  // Wrapper for Delete
  async function handleDelete() {
    if (isDeleting) return
    
    // Optional double check
    // if (!confirm("Are you sure?")) return

    setIsDeleting(true)
    
    // We handle the promise manually to read the result object
    const result = await deleteProperty(property.id)

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message) // This will show "Cannot delete... units exist"
    }

    setIsDeleting(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {/* 1. Manage Units Link */}
          <Link href={`/dashboard/properties/${property.id}`}>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Manage Units
            </DropdownMenuItem>
          </Link>

          {/* 2. Edit Trigger */}
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault()
              setShowEditModal(true)
            }}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit Property
          </DropdownMenuItem>

          {/* 3. Delete Action */}
          <DropdownMenuItem 
            onSelect={(e) => e.preventDefault()}
            className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
          >
            <form action={handleDelete} className="w-full flex items-center">
               <button type="submit" className="flex items-center w-full" disabled={isDeleting}>
                 {isDeleting ? "Deleting..." : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
               </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- EDIT MODAL --- */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update the details for <strong>{property.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <form action={handleUpdate} className="space-y-4 mt-2">
            <input type="hidden" name="id" value={property.id} />
            
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input 
                name="name" 
                defaultValue={property.name} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                name="address" 
                defaultValue={property.address || ''} 
                placeholder="e.g. Kigali, Kimisagara" 
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={isUpdating}>
                {isUpdating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  "Update Property"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}