'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Building2, User, Phone, Wallet, MapPin } from "lucide-react"

interface InvoiceDetailsDialogProps {
  invoice: any
  isOpen: boolean
  onClose: () => void
}

export function InvoiceDetailsDialog({ invoice, isOpen, onClose }: InvoiceDetailsDialogProps) {
  if (!invoice) return null

  // Format Helper: DD/MM/YYYY
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const statusColors: Record<string, string> = {
    PAID: "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800",
    OVERDUE: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800",
    PENDING: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800",
    DRAFT: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800",
    PARTIAL: "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border shadow-lg bg-background text-foreground">
        
        {/* HEADER */}
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-start pr-6">
            <div>
              <DialogTitle className="text-xl font-bold">Invoice Details</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 font-mono">#{invoice.id.slice(0, 8)}</p>
            </div>
            {/* @ts-ignore */}
            <Badge variant="outline" className={`${statusColors[invoice.status] || statusColors.PENDING} px-3 py-1`}>
              {invoice.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* 1. TENANT & UNIT CARD */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base">{invoice.leases?.tenants?.name}</h4>
                
                {/* ✅ ADDED: WALLET BADGE */}
                {(invoice.leases?.credit_balance > 0) && (
                   <Badge variant="secondary" className="h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0">
                     <Wallet className="h-3 w-3 mr-1" />
                     {Number(invoice.leases.credit_balance).toLocaleString()}
                   </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                   <Phone className="h-3.5 w-3.5" /> {invoice.leases?.tenants?.phone || "No phone"}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                   <Building2 className="h-3.5 w-3.5" /> Unit {invoice.leases?.units?.unit_number}
                </span>
                <span className="flex items-center gap-1.5">
                   <MapPin className="h-3.5 w-3.5" /> {invoice.leases?.units?.properties?.name}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DATES GRID */}
          <div className="grid grid-cols-2 gap-4 px-1">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Issued Date
              </span>
              <p className="font-semibold text-sm">
                {formatDate(invoice.created_at)}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Due Date
              </span>
              <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          <Separator />

          {/* 3. FINANCIAL BREAKDOWN */}
          <div className="space-y-3 px-1">
             <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Rent Amount</span>
               <span className="font-medium">{Number(invoice.amount).toLocaleString()} RWF</span>
             </div>
             
             {invoice.amount_paid > 0 && (
               <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                 <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Paid So Far</span>
                 <span className="font-medium">-{Number(invoice.amount_paid).toLocaleString()} RWF</span>
               </div>
             )}

             <Separator className="my-2" />
             
             <div className="flex justify-between items-center pt-1">
               <span className="font-bold text-lg">Total Due</span>
               <span className="text-xl font-bold font-mono tracking-tight text-primary">
                 {(Number(invoice.amount) - Number(invoice.amount_paid || 0)).toLocaleString()} RWF
               </span>
             </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}