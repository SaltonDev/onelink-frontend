'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // <--- Import Router
import { updateTenant } from '@/app/dashboard/tenants/actions'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, MoreHorizontal, FileClock, UserCog } from "lucide-react"
import { toast } from "sonner" 

export function TenantActions({ tenant }: { tenant: any }) {
  const router = useRouter() // <--- Init Router
  const [showEdit, setShowEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await updateTenant(formData)
      toast.success("Tenant updated successfully")
      setShowEdit(false)
    } catch (error) {
      toast.error("Failed to update tenant")
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
          <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
          
          {/* 1. NEW: NAVIGATE TO HISTORY PAGE */}
          <DropdownMenuItem onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}>
             <FileClock className="mr-2 h-4 w-4" /> Payment History
          </DropdownMenuItem>

          {/* 2. EDIT */}
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
             <Pencil className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* EDIT MODAL (Kept same as before) */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Details</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 mt-2">
            <input type="hidden" name="id" value={tenant.id} />
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="name" defaultValue={tenant.name} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="phone" defaultValue={tenant.phone} required />
            </div>
            <div className="space-y-2">
              <Label>National ID</Label>
              <Input name="national_id" defaultValue={tenant.national_id || ''} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" defaultValue={tenant.email || ''} type="email" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}