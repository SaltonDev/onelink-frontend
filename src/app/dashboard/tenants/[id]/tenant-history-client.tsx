'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Smartphone, Banknote, Landmark, ArrowUpRight, FileDown, Eye, Loader2 } from "lucide-react"
import { DownloadReceiptButton } from '@/components/documents/buttons/download-receipt-button'
import { generateGroupedStatementPDF } from '@/utils/statement-generator'

export function TenantHistoryClient({ payments, tenantName }: { payments: any[], tenantName: string }) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  // --- 1. THE NEW "TIME TRAVEL" DATA PREPARER ---
  const prepareReceiptData = (currentPayment: any) => {
    const leaseRent = Number(currentPayment.leases?.rent_amount || 0)
    const invoiceTotal = Number(currentPayment.invoices?.amount || 0)
    
    // 1. Total Bill Amount (The "Goal")
    const fullAmount = invoiceTotal > 0 ? invoiceTotal : (leaseRent > 0 ? leaseRent : Number(currentPayment.amount))

    // 2. TIMELINE ANALYSIS
    // We need to know:
    // A. What was paid BEFORE this transaction? (To find Opening Balance)
    // B. What is the cumulative total INCLUDING this transaction? (To find Closing Balance)
    
    // Filter payments for THIS invoice only
    const invoicePayments = payments.filter(p => p.invoice_id === currentPayment.invoice_id)
    
    // Sort them chronologically (Oldest first) so we can replay history
    invoicePayments.sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())

    let paidBeforeThis = 0
    let foundCurrent = false

    for (const p of invoicePayments) {
        if (p.id === currentPayment.id) {
            foundCurrent = true
            break // We stop right before adding the current one to "paidBefore"
        }
        paidBeforeThis += Number(p.amount)
    }

    // 3. ACCOUNTING MATH
    const openingBalance = fullAmount - paidBeforeThis // What they owed when they walked in
    const amountPaidNow = Number(currentPayment.amount)
    
    // Logic: How much of THIS payment went to Rent vs Wallet?
    // If Opening Balance was 50k, and I pay 250k:
    // -> 50k goes to Rent (Settlement)
    // -> 200k goes to Wallet (Excess)
    let allocatedToRent = 0
    let allocatedToWallet = 0

    if (openingBalance <= 0) {
        // Only happens if they were already fully paid and are paying MORE (pure credit)
        allocatedToRent = 0
        allocatedToWallet = amountPaidNow
    } else {
        if (amountPaidNow >= openingBalance) {
            allocatedToRent = openingBalance // Pays off the remaining debt
            allocatedToWallet = amountPaidNow - openingBalance // Rest is credit
        } else {
            allocatedToRent = amountPaidNow // All of it goes to rent (still partial)
            allocatedToWallet = 0
        }
    }

    // 4. Closing Balance (After this payment)
    const closingBalance = openingBalance - amountPaidNow

    return {
      id: currentPayment.id || 'REC',
      payment_date: currentPayment.payment_date || new Date().toISOString(),
      due_date: currentPayment.payment_date || new Date().toISOString(),
      
      amount: fullAmount,           // Total Bill (200k)
      amount_paid: amountPaidNow,   // What they paid TODAY (250k)
      
      // NEW: Accounting Context passed to PDF
      opening_balance: openingBalance,    // Owed 50k
      allocated_rent: allocatedToRent,    // Cleared 50k
      allocated_wallet: allocatedToWallet,// Credit 200k
      closing_balance: closingBalance,    // Final Result (-200k)

      leases: {
        tenants: { name: currentPayment.leases?.tenants?.name || tenantName || "Valued Tenant" },
        units: { unit_number: currentPayment.leases?.units?.unit_number || 'N/A' },
        rent_amount: leaseRent
      }
    }
  }

  // --- (GROUPING LOGIC REMAINS SAME) ---
  const { groupedPayments, sortedMonths } = useMemo(() => {
    const groups: Record<string, any[]> = {}
    payments.forEach(p => {
      const date = new Date(p.payment_date)
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    const sorted = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return { groupedPayments: groups, sortedMonths: sorted }
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

  // --- EXPORT FUNCTION ---
  const exportStatement = async () => {
    setIsExporting(true)
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    let officialRent = 0
    if (payments.length > 0) {
        try {
            const mostRecentPayment = payments.reduce((prev, current) => 
                (new Date(prev.payment_date) > new Date(current.payment_date)) ? prev : current
            )
            if (mostRecentPayment.lease_id) {
                const { data: leaseData } = await supabase.from('leases').select('rent_amount').eq('id', mostRecentPayment.lease_id).single()
                if (leaseData) officialRent = Number(leaseData.rent_amount)
            }
        } catch (err) { console.error(err) }
    }

    const entityInfo = [`Tenant: ${tenantName}`, `Generated: ${new Date().toLocaleDateString('en-GB')}`]
    if (officialRent > 0) entityInfo.splice(1, 0, `Monthly Rent: ${officialRent.toLocaleString()} RWF`)

    const groupsForPdf = sortedMonths.map(month => {
        const monthPayments = groupedPayments[month]
        const monthlySubtotal = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        const rows = monthPayments.map((p: any) => [
            new Date(p.payment_date).toLocaleDateString('en-GB'),
            p.method,
            `Unit ${p.leases?.units?.unit_number || '-'}`,
            p.notes || '-',
            Number(p.amount).toLocaleString() + ' RWF'
        ])
        return { month: month, subtotal: monthlySubtotal.toLocaleString() + ' RWF', rows: rows }
    })

    generateGroupedStatementPDF({
        title: "Tenant Payment History",
        subtitle: "Statement of Account",
        entityInfo: entityInfo,
        grandTotal: totalPaid.toLocaleString() + ' RWF',
        groups: groupsForPdf,
        filename: `${tenantName.replace(/\s+/g, '_')}_Statement.pdf`
    })
    setIsExporting(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Detailed History</CardTitle>
        <Button variant="outline" size="sm" onClick={exportStatement} disabled={isExporting} className="gap-2">
           {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
           {isExporting ? 'Generating...' : 'Export Full Statement'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sortedMonths.map((month) => {
            const monthPayments = groupedPayments[month]
            const monthlyTotal = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
            return (
              <div key={month} className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">{month}</h3>
                  <span className="text-xs font-medium text-slate-500">Total: {monthlyTotal.toLocaleString()} RWF</span>
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
                            <TableCell className="font-medium text-xs">{new Date(p.payment_date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell>
                               <div className="flex items-center gap-3">
                                  {getIcon(p.method)}
                                  <div><div className="font-semibold text-sm">{isWallet ? 'Wallet' : 'Received'}</div><div className="text-xs text-muted-foreground">{p.method}</div></div>
                               </div>
                            </TableCell>
                            <TableCell><div className="flex flex-col"><span className="font-medium text-sm">Unit {p.leases?.units?.unit_number}</span><span className="text-xs text-muted-foreground">{p.leases?.units?.properties?.name}</span></div></TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.notes || '-'}</TableCell>
                            <TableCell className="text-right"><Badge variant="outline" className={`font-mono text-sm ${isWallet ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}`}>{isWallet ? '-' : '+'}{Number(p.amount).toLocaleString()}</Badge></TableCell>
                            <TableCell className="text-right">
                               <div className="flex items-center justify-end gap-1">
                                 <DownloadReceiptButton invoice={safeReceiptData} variant="icon" />
                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(p)}><Eye className="h-4 w-4 text-gray-400" /></Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
      {/* DIALOG USES THE SAME PREPARE LOGIC */}
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