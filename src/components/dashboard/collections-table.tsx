'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Wallet, Calendar, ArrowRight, Search, Eye, CheckCircle2 } from "lucide-react"
import { RecordPaymentModal } from "@/components/modals/record-payment-modal"
import { InvoiceDetailsDialog } from "./invoice-details-dialog"

interface CollectionsTableProps {
  invoices: any[]
  onPaymentSuccess: () => void 
}

export function CollectionsTable({ invoices, onPaymentSuccess }: CollectionsTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [viewInvoice, setViewInvoice] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // --- FILTER LOGIC ---
  const filteredInvoices = invoices.filter(inv => 
    inv.leases?.tenants?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.leases?.units?.unit_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // --- DATE FORMATTER ---
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) 
  }

  // --- EMPTY STATE (FIXED) ---
  if (invoices.length === 0) {
    return (
      <Card className="border-dashed border-2 shadow-none bg-transparent">
        <CardContent className="p-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-full bg-green-100/10 flex items-center justify-center mb-2">
               <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-bold text-xl tracking-tight">All Caught Up!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Great job! There are no pending collections at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        {/* HEADER */}
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               <CardTitle className="text-base font-semibold">
                 Pending Payments
               </CardTitle>
               <Badge variant="secondary">
                 {filteredInvoices.length} Found
               </Badge>
             </div>
             
             {/* SEARCH BAR */}
             <div className="relative w-full sm:w-72">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Search tenant name or unit..." 
                 className="pl-8"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Tenant Details</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium">Balance Due</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((inv) => {
                  const balance = Number(inv.amount) - Number(inv.amount_paid || 0)
                  const isOverdue = inv.status === 'OVERDUE'

                  return (
                    <tr key={inv.id} className="group hover:bg-muted/50 transition-colors">
                      {/* TENANT COL (UPDATED WITH WALLET BADGE) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{inv.leases?.tenants?.name}</div>
                          
                          {/* ✅ NEW: Wallet Badge Logic */}
                          {(inv.leases?.credit_balance > 0) && (
                            <Badge variant="outline" className="h-5 px-1.5 gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                              <Wallet className="h-3 w-3" />
                              <span className="text-[10px] font-mono">
                                {Number(inv.leases.credit_balance).toLocaleString()}
                              </span>
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                           Unit {inv.leases?.units?.unit_number}
                        </div>
                      </td>

                      {/* DUE DATE COL */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                           <Calendar className="h-3 w-3" />
                           {formatDate(inv.due_date)}
                        </div>
                      </td>

                      {/* BALANCE COL */}
                      <td className="p-4">
                         <div className="font-mono font-bold">
                           {balance.toLocaleString()} <span className="text-xs font-sans font-normal text-muted-foreground">RWF</span>
                         </div>
                      </td>

                      {/* STATUS COL */}
                      <td className="p-4">
                         <Badge 
                           variant={isOverdue ? 'destructive' : 'secondary'}
                           className={!isOverdue ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20' : ''}
                         >
                           {inv.status}
                         </Badge>
                      </td>

                      {/* ACTIONS COL */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            onClick={() => setViewInvoice(inv)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-8"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            Pay <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredInvoices.length === 0 && searchQuery && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No results found for "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <RecordPaymentModal 
        invoice={selectedInvoice}
        open={!!selectedInvoice}       
        setOpen={(open) => !open && setSelectedInvoice(null)} 
        onSuccess={onPaymentSuccess}   
      />

      <InvoiceDetailsDialog 
        invoice={viewInvoice}
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
      />
    </>
  )
}