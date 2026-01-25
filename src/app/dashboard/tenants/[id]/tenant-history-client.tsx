'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Smartphone, Banknote, Landmark, ArrowUpRight, FileDown, Eye, Building2 } from "lucide-react"
import { DownloadReceiptButton } from '@/components/documents/buttons/download-receipt-button'
// IMPORT THE NEW GENERATOR
import { generateStatementPDF } from '@/utils/statement-generator'

export function TenantHistoryClient({ payments, tenantName }: { payments: any[], tenantName: string }) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // DATA TRANSLATOR (For Receipts)
  const prepareReceiptData = (payment: any) => {
    return {
      id: payment.id || 'REC',
      payment_date: payment.payment_date || new Date().toISOString(),
      due_date: payment.payment_date || new Date().toISOString(),
      amount_paid: Number(payment.amount) || 0,
      amount: Number(payment.amount) || 0, 
      leases: {
        tenants: { name: payment.leases?.tenants?.name || tenantName || "Valued Tenant" },
        units: { unit_number: payment.leases?.units?.unit_number || 'N/A' }
      }
    }
  }

  // GROUP BY MONTH LOGIC
  const groupedPayments = useMemo(() => {
    const groups: Record<string, any[]> = {}
    payments.forEach(p => {
      const date = new Date(p.payment_date)
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' }) 
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return groups
  }, [payments])

  const getIcon = (method: string) => {
    switch(method) {
      case 'WALLET': return <div className="p-1.5 bg-blue-100 rounded text-blue-600"><ArrowUpRight className="h-4 w-4" /></div>
      case 'MOMO': return <div className="p-1.5 bg-yellow-100 rounded text-yellow-600"><Smartphone className="h-4 w-4" /></div>
      case 'CASH': return <div className="p-1.5 bg-green-100 rounded text-green-600"><Banknote className="h-4 w-4" /></div>
      case 'BANK': return <div className="p-1.5 bg-purple-100 rounded text-purple-600"><Landmark className="h-4 w-4" /></div>
      default: return <div className="p-1.5 bg-gray-100 rounded text-gray-600"><Banknote className="h-4 w-4" /></div>
    }
  }

  // EXPORT FULL STATEMENT (Using New Professional Generator)
  const exportStatement = () => {
    const tableData = payments.map(p => [
      // --- FIX IS HERE: Force 'en-GB' for dd/mm/yyyy ---
      new Date(p.payment_date).toLocaleDateString('en-GB'),
      p.method,
      `Unit ${p.leases?.units?.unit_number || '-'}`,
      p.notes || '-',
      Number(p.amount).toLocaleString() + ' RWF'
    ])

    generateStatementPDF({
        title: "Tenant Payment History",
        subtitle: "Statement of Account",
        entityInfo: [
            `Tenant: ${tenantName}`,
            `Total Records: ${payments.length}`
        ],
        columns: ['Date', 'Method', 'Unit', 'Notes', 'Amount'],
        data: tableData,
        filename: `${tenantName.replace(/\s+/g, '_')}_Statement.pdf`
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Detailed History</CardTitle>
        <Button variant="outline" size="sm" onClick={exportStatement} className="gap-2">
           <FileDown className="h-4 w-4" /> Export Full Statement
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedPayments).map(([month, monthPayments]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">{month}</h3>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthPayments.map((p) => {
                      const isWallet = p.method === 'WALLET'
                      const safeReceiptData = prepareReceiptData(p)

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-xs">
                             {/* Optional: Fix visual table date as well */}
                             {new Date(p.payment_date).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-3">
                                {getIcon(p.method)}
                                <div>
                                  <div className="font-semibold text-sm">{isWallet ? 'Wallet' : 'Received'}</div>
                                  <div className="text-xs text-muted-foreground">{p.method}</div>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="font-medium text-sm">Unit {p.leases?.units?.unit_number}</span>
                               <span className="text-xs text-muted-foreground">{p.leases?.units?.properties?.name}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={`font-mono text-sm ${isWallet ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}`}>
                              {isWallet ? '-' : '+'}{Number(p.amount).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-1">
                               <DownloadReceiptButton invoice={safeReceiptData} variant="icon" />
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(p)}>
                                 <Eye className="h-4 w-4 text-gray-400" />
                               </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
         <DialogContent>
            <DialogHeader><DialogTitle>Transaction Details</DialogTitle></DialogHeader>
            {selectedPayment && (
               <div className="space-y-6 pt-2">
                  <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-dashed">
                      <span className="text-sm text-muted-foreground uppercase font-medium">Amount</span>
                      <span className="text-3xl font-bold font-mono mt-1 text-green-600">{Number(selectedPayment.amount).toLocaleString()} RWF</span>
                      <Badge className="mt-3">Completed</Badge>
                  </div>
                  <div className="flex justify-end pt-2">
                      <DownloadReceiptButton invoice={prepareReceiptData(selectedPayment)} variant="default" />
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </Card>
  )
}