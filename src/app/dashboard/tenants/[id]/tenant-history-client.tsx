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
import { Smartphone, Banknote, Landmark, ArrowUpRight, ArrowDownLeft, FileDown, Eye, Building2 } from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function TenantHistoryClient({ payments, tenantName }: { payments: any[], tenantName: string }) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // 1. GROUP BY MONTH LOGIC
  const groupedPayments = useMemo(() => {
    const groups: Record<string, any[]> = {}
    
    payments.forEach(p => {
      const date = new Date(p.payment_date)
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' }) // e.g., "January 2026"
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

  // --- PDF EXPORT FUNCTION ---
  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text("Tenant Payment Statement", 14, 20)
    
    doc.setFontSize(12)
    doc.text(`Tenant: ${tenantName}`, 14, 30)
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 36)

    // Table Data
    const tableData = payments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      p.method,
      `${p.leases?.units?.properties?.name || ''} - ${p.leases?.units?.unit_number || ''}`,
      p.notes || '-',
      Number(p.amount).toLocaleString() + ' RWF'
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Method', 'Property/Unit', 'Notes', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // Green header
    })

    // Footer "Made by OneLink"
    const pageCount = doc.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setTextColor(150)
        doc.text('Made by OneLink System', 14, doc.internal.pageSize.height - 10)
    }

    doc.save(`${tenantName}_Statement.pdf`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Detailed History</CardTitle>
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
           <FileDown className="h-4 w-4" /> Export PDF
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedPayments).map(([month, monthPayments]) => (
            <div key={month} className="space-y-3">
              {/* MONTH HEADER */}
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                  {month}
                </h3>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>

              {/* MONTH TABLE */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthPayments.map((p) => {
                      const isWallet = p.method === 'WALLET'
                      return (
                        <TableRow key={p.id}>
                          {/* DATE (Removed Time) */}
                          <TableCell className="font-medium text-xs">
                             {new Date(p.payment_date).toLocaleDateString()}
                          </TableCell>

                          {/* TYPE/METHOD */}
                          <TableCell>
                             <div className="flex items-center gap-3">
                                {getIcon(p.method)}
                                <div>
                                  <div className="font-semibold text-sm">{isWallet ? 'Wallet Applied' : 'Payment Received'}</div>
                                  <div className="text-xs text-muted-foreground">{p.method}</div>
                                </div>
                             </div>
                          </TableCell>

                          {/* LOCATION */}
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="font-medium text-sm">Unit {p.leases?.units?.unit_number}</span>
                               <span className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Building2 className="h-3 w-3" />
                                 {p.leases?.units?.properties?.name || 'Main Property'}
                               </span>
                             </div>
                          </TableCell>

                          {/* NOTES */}
                          <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                            {p.notes || '-'}
                          </TableCell>

                          {/* AMOUNT */}
                          <TableCell className="text-right">
                            <Badge variant="outline" className={`font-mono text-sm ${isWallet ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-green-600 border-green-200 bg-green-50'}`}>
                              {isWallet ? '-' : '+'}{Number(p.amount).toLocaleString()}
                            </Badge>
                          </TableCell>

                          {/* ACTION */}
                          <TableCell>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(p)}>
                               <Eye className="h-4 w-4 text-gray-400" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          
          {payments.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">No transaction history available.</div>
          )}
        </div>
      </CardContent>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
               <div className="space-y-6 pt-2">
                  <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                     <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Amount</span>
                     <span className={`text-3xl font-bold font-mono mt-1 ${selectedPayment.method === 'WALLET' ? 'text-blue-600' : 'text-green-600'}`}>
                        {Number(selectedPayment.amount).toLocaleString()} RWF
                     </span>
                     <Badge className="mt-3">Completed</Badge>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium">{selectedPayment.method}</span>
                     </div>
                     <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Property</span>
                        <span className="font-medium">{selectedPayment.leases?.units?.properties?.name}</span>
                     </div>
                     <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Unit</span>
                        <span className="font-medium">{selectedPayment.leases?.units?.unit_number}</span>
                     </div>
                     <div className="pt-2">
                        <span className="text-muted-foreground block mb-1 text-sm">Notes</span>
                        <div className="p-3 bg-muted/50 rounded-md text-sm">
                           {selectedPayment.notes || 'No notes provided.'}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </Card>
  )
}