'use client'

import { useState } from 'react'
import { createUnit } from '@/app/dashboard/properties/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { MoneyInput } from "@/components/ui/money-input" // Assuming you have this, otherwise use standard Input

export function AddUnitModal({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // Add the hidden ID
    formData.append('property_id', propertyId)

    const promise = createUnit(formData)

    toast.promise(promise, {
      loading: 'Adding unit...',
      success: (result) => {
        if (result.success) {
          setOpen(false)
          return 'Unit created successfully'
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || 'Failed to create unit'
    })

    try {
      await promise
    } catch (e) {
      // handled by toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Number</Label>
              <Input name="unit_number" placeholder="e.g. G-01" required />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input name="floor_number" placeholder="e.g. Ground" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Monthly Rent (RWF)</Label>
            {/* If MoneyInput doesn't exist, use: <Input type="number" name="rent_amount" ... /> */}
            <MoneyInput name="rent_amount" placeholder="0" required />
          </div>

          <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Unit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}