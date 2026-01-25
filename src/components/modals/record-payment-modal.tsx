'use client'

import { useState, useEffect } from 'react'
import { recordPayment } from '@/app/dashboard/invoices/action'
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"

interface RecordPaymentModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  invoice: any
  onSuccess?: () => void 
}

export function RecordPaymentModal({ open, setOpen, invoice, onSuccess }: RecordPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [useWallet, setUseWallet] = useState(false)
  const [cashAmount, setCashAmount] = useState<string>('') 
  const [paymentDate, setPaymentDate] = useState<string>('')

  // Safe Math
  const amountDue = invoice ? Number(invoice.amount) - (Number(invoice.amount_paid) || 0) : 0
  const walletBalance = invoice?.leases?.credit_balance || 0
  
  const walletCover = useWallet ? Math.min(amountDue, walletBalance) : 0
  const remainingDue = Math.max(0, amountDue - walletCover)

  useEffect(() => {
    if (open) {
      setUseWallet(false)
      setCashAmount(amountDue.toString())
      // Default to today
      setPaymentDate(new Date().toISOString().split('T')[0])
    }
  }, [open, amountDue])

  useEffect(() => {
    setCashAmount(remainingDue.toString())
  }, [useWallet, remainingDue])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // 1. FORCE the correct amount
    formData.set('amount', cashAmount)
    
    // 2. FORCE the payment date
    formData.set('payment_date', paymentDate)

    // 3. FORCE the Invoice ID (THE FIX)
    if (invoice?.id) {
        formData.set('invoice_id', invoice.id)
    } else {
        toast.error("Error: Invoice ID missing. Close and try again.")
        setIsLoading(false)
        return
    }

    // 4. Handle Wallet
    if (useWallet) formData.set('use_wallet', 'on')

    toast.promise(recordPayment(formData), {
      loading: 'Processing payment...',
      success: (data) => {
        setIsLoading(false)
        setOpen(false)
        if (onSuccess) onSuccess() 
        return data.message
      },
      error: (err) => {
        setIsLoading(false)
        return `Failed: ${err.message}`
      }
    })
  }

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
             Unit {invoice.leases?.units?.unit_number} - {invoice.leases?.tenants?.name}
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-5 mt-2">
          
          {/* 1. WALLET SECTION */}
          {walletBalance > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                  <Wallet className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Use Wallet Credit</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Available: {walletBalance.toLocaleString()} RWF</p>
                </div>
              </div>
              <Switch checked={useWallet} onCheckedChange={setUseWallet} />
            </div>
          )}

          {/* 2. SUMMARY */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm space-y-1">
             <div className="flex justify-between text-muted-foreground">
               <span>Total Invoice Due:</span>
               <span>{amountDue.toLocaleString()}</span>
             </div>
             {useWallet && (
               <div className="flex justify-between text-green-600">
                 <span>Wallet Applied:</span>
                 <span>-{walletCover.toLocaleString()}</span>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* 3. DATE INPUT */}
             <div className="space-y-2">
               <Label>Payment Date</Label>
               <Input 
                 type="date" 
                 value={paymentDate}
                 onChange={(e) => setPaymentDate(e.target.value)}
                 required
               />
             </div>

             {/* 4. METHOD */}
             <div className="space-y-2">
               <Label>Method</Label>
               <Select name="method" defaultValue="MOMO">
                 <SelectTrigger>
                   <SelectValue placeholder="Select" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="MOMO">Mobile Money</SelectItem>
                   <SelectItem value="CASH">Cash</SelectItem>
                   <SelectItem value="BANK">Bank Transfer</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>

          {/* 5. CASH INPUT */}
          <div className="space-y-2">
            <Label>Amount Received</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-mono">RWF</span>
                <Input 
                  type="number"
                  name="amount" 
                  value={cashAmount} 
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="pl-12 font-mono text-lg font-bold"
                  required 
                />
            </div>
          </div>

          <div className="space-y-2">
             <Label>Notes (Optional)</Label>
             <Input name="notes" placeholder="Transaction ID or Ref..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}