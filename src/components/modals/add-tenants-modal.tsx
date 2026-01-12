'use client'

import { useState } from 'react'
import { createTenant } from '@/app/dashboard/tenants/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner" // <--- Added Toast

export function AddTenantModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    const promise = createTenant(formData)

    toast.promise(promise, {
      loading: 'Adding tenant...',
      success: (result) => {
        if (result.success) {
          setOpen(false)
          return 'Tenant added successfully'
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || 'Failed to add tenant'
    })

    try { await promise } catch (e) { /* handled by toast */ }
    finally { setIsLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input name="name" placeholder="e.g. Keza Marie" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="phone" placeholder="07..." required />
            </div>
            <div className="space-y-2">
              <Label>National ID (Optional)</Label>
              <Input name="national_id" placeholder="119..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input name="email" type="email" placeholder="example@gmail.com" />
          </div>
          <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Tenant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}