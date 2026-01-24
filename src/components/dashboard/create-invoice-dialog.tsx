'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner" 

// --- SCHEMA ---
// Fix: Removed .default() from 'type' to make the type strict (string only, no undefined)
const formSchema = z.object({
  tenant_id: z.string().min(1, "Tenant is required"),
  unit_id: z.string().min(1, "Unit is required"),
  amount: z.string().min(1, "Amount is required"),
  due_date: z.string().min(1, "Due Date is required"),
  type: z.string().min(1, "Type is required"), 
})

// Define the type explicitly based on the schema
type InvoiceFormValues = z.infer<typeof formSchema>

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const supabase = createClient()

  // Fix: Explicitly typed useForm and provided ALL default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenant_id: "",
      unit_id: "",
      amount: "",
      due_date: "", // or new Date().toISOString().split('T')[0]
      type: "RENT",
    },
  })

  // --- FETCH TENANTS & UNITS ---
  const fetchData = async () => {
    // Get active tenants
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('status', 'ACTIVE')
    
    // Get occupied units (to link them)
    const { data: unitData } = await supabase
      .from('units')
      .select('id, unit_number, properties(name)')
      .eq('status', 'OCCUPIED')
    
    if (tenantData) setTenants(tenantData)
    if (unitData) setUnits(unitData)
  }

  // Trigger fetch when dialog opens
  if (open && tenants.length === 0) {
    fetchData()
  }

  // --- SUBMIT ---
  async function onSubmit(values: InvoiceFormValues) {
    setIsLoading(true)
    try {
      // 1. Find the active lease for this tenant/unit combo
      const { data: lease } = await supabase
        .from('leases')
        .select('id')
        .eq('tenant_id', values.tenant_id)
        .eq('unit_id', values.unit_id)
        .eq('status', 'ACTIVE')
        .single()

      if (!lease) {
        toast.error("No active lease found for this tenant in this unit.")
        setIsLoading(false)
        return
      }

      // 2. Create the Invoice
      const { error } = await supabase.from('invoices').insert({
        lease_id: lease.id,
        amount: parseFloat(values.amount),
        due_date: values.due_date,
        status: 'PENDING',
        type: values.type
      })

      if (error) throw error

      toast.success("Invoice created successfully")
      onSuccess() // Refresh the table
      onOpenChange(false) // Close modal
      form.reset() // Reset form
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to create invoice")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* TENANT SELECT */}
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* UNIT SELECT */}
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.unit_number} ({u.properties?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AMOUNT */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (RWF)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DUE DATE */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* TYPE (Hidden or Selectable, currently defaulted to RENT) */}
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RENT">Rent</SelectItem>
                      <SelectItem value="WATER">Water</SelectItem>
                      <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                      <SelectItem value="FEE">Late Fee / Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}