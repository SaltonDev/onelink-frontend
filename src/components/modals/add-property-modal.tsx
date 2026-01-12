'use client'

import { useState } from 'react'
import { createProperty } from '@/app/dashboard/properties/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export function AddPropertyModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // We use toast.promise for nice UI feedback
    const promise = createProperty(formData)

    toast.promise(promise, {
      loading: 'Adding property...',
      success: (result) => {
        if (result.success) {
          setOpen(false)
          return result.message
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => {
        return err.message || 'Something went wrong'
      }
    })

    try {
        await promise
    } catch(e) {
        // Error caught by toast
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Property
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Building</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Property Name</Label>
            <Input name="name" placeholder="e.g. Ubumwe House" required />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="address" placeholder="e.g. Kigali, Kimisagara" required />
          </div>
          <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Property"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}