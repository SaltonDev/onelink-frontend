'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { InvoiceManager } from '@/components/dashboard/invoice-manager'
import { CollectionsTable } from '@/components/dashboard/collections-table'
import { DownloadReceiptButton } from '@/components/documents/buttons/download-receipt-button'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Wallet, AlertCircle, FileDown, History } from "lucide-react"
import { generateStatementPDF } from '@/utils/statement-generator'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([]) // <--- NEW STATE FOR HISTORY
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Fetch Invoices (For Collections & Approvals)
    const { data: rawInvoices } = await supabase
      .from('invoices')
      .select(`*, leases(rent_amount, credit_balance, tenants(name, phone), units(unit_number, properties(name)))`)
      .order('due_date', { ascending: false })

    // 2. Fetch Payments (For History Tab - Shows Partial Payments instantly)
    const { data: rawPayments } = await supabase
      .from('payments')
      .select(`
        *, 
        invoices (id, amount, status, due_date),
        leases (rent_amount, tenants(name), units(unit_number, properties(name)))
      `)
      .order('payment_date', { ascending: false })

    if (rawInvoices) {
      // Self-Healing Logic for Overdue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const overdueIds = rawInvoices.filter((inv: any) => {
          const dueDate = new Date(inv.due_date)
          return inv.status === 'PENDING' && dueDate < today
      }).map((inv: any) => inv.id)

      if (overdueIds.length > 0) {
        await supabase.from('invoices').update({ status: 'OVERDUE' }).in('id', overdueIds)
        // Optimistic update
        rawInvoices.forEach((inv: any) => { if (overdueIds.includes(inv.id)) inv.status = 'OVERDUE' })
      }
      setInvoices(rawInvoices)
    }

    if (rawPayments) {
      setPayments(rawPayments)
    }
    
    setLoading(false)
  }

  // --- PREPARE RECEIPT DATA FOR DOWNLOAD BUTTON ---
  // This wraps the payment row with the "Full Rent" context so the generator knows it's partial
  const getReceiptData = (payment: any) => {
    // The total is the Lease Rent (if available) or the linked Invoice Amount
    const totalDue = payment.leases?.rent_amount || payment.invoices?.amount || payment.amount
    
    return {
      id: payment.id,
      payment_date: payment.payment_date,
      // CRITICAL: We pass the TRANSACTION amount as 'amount_paid'
      amount_paid: Number(payment.amount), 
      // CRITICAL: We pass the FULL INVOICE/LEASE amount as 'amount'
      amount: Number(totalDue), 
      status: Number(payment.amount) < Number(totalDue) ? 'PARTIAL' : 'PAID',
      leases: payment.leases,
      // Pass linked invoice ID for reference
      invoice_id: payment.invoices?.id
    }
  }

  // --- EXPORT HISTORY FUNCTION ---
  const exportHistoryPDF = () => {
    const tableData = payments.map(p => [
      new Date(p.payment_date).toLocaleDateString('en-GB'),
      p.leases?.tenants?.name || 'Unknown',
      p.leases?.units?.unit_number || '-',
      // Show "Paid / Total" in the PDF to be clear
      `${Number(p.amount).toLocaleString()} / ${Number(p.leases?.rent_amount || p.invoices?.amount).toLocaleString()}`
    ])

    generateStatementPDF({
        title: "Payment Transaction Report",
        subtitle: "Real-time Financial History",
        entityInfo: [
            `Total Collected: ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} RWF`,
            `Transactions: ${payments.length}`
        ],
        columns: ['Date Paid', 'Tenant', 'Unit', 'Amount (Paid / Total)'],
        data: tableData,
        filename: 'OneLink_Transactions.pdf'
    })
  }

  // --- STATS CALCULATION ---
  const drafts = invoices.filter(i => i.status === 'DRAFT')
  // Pending includes Partials now, as they are not fully settled
  const pending = invoices.filter(i => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(i.status))
  
  const totalReceivable = pending.reduce((sum, inv) => {
    return sum + (Number(inv.amount) - Number(inv.amount_paid || 0))
  }, 0)

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Cockpit</h2>
          <p className="text-gray-500">Billing pipeline and revenue tracking.</p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Drafts</CardTitle>
             <Clock className="h-4 w-4 text-blue-500" />
           </CardHeader>
           <CardContent><div className="text-2xl font-bold">{drafts.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50/10">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-red-600">Arrears</CardTitle>
             <AlertCircle className="h-4 w-4 text-red-600" />
           </CardHeader>
           <CardContent><div className="text-2xl font-bold text-red-600">{totalReceivable.toLocaleString()} RWF</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Collections</CardTitle>
             <Wallet className="h-4 w-4 text-green-600" />
           </CardHeader>
           <CardContent><div className="text-2xl font-bold">{pending.length}</div></CardContent>
        </Card>
      </div>

      {/* MAIN INTERFACE */}
      <Tabs defaultValue="collections" className="space-y-4"> 
        <TabsList>
          <TabsTrigger value="approvals">Approvals ({drafts.length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({pending.length})</TabsTrigger>
          <TabsTrigger value="history">History (Transactions)</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <InvoiceManager initialInvoices={drafts} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="collections">
           <CollectionsTable invoices={pending} onPaymentSuccess={fetchData} />
        </TabsContent>

        {/* UPDATED HISTORY TAB: Uses 'payments' state instead of 'invoices' */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" /> Transaction Log
                </CardTitle>
                <Button variant="outline" size="sm" onClick={exportHistoryPDF} className="gap-2">
                    <FileDown className="h-4 w-4" /> Export Report
                </Button>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-4">Date Paid</th>
                      <th className="p-4">Tenant</th>
                      <th className="p-4">Unit</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                      {payments.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions found.</td></tr>
                      ) : (
                        payments.map(payment => {
                          const total = payment.leases?.rent_amount || payment.invoices?.amount
                          // If they paid less than total, it's partial
                          const isPartial = Number(payment.amount) < Number(total)
                          
                          return (
                          <tr key={payment.id} className="hover:bg-muted/50">
                             <td className="p-4">{new Date(payment.payment_date).toLocaleDateString('en-GB')}</td>
                             <td className="p-4 font-medium">{payment.leases?.tenants?.name}</td>
                             <td className="p-4">{payment.leases?.units?.unit_number}</td>
                             <td className="p-4 font-mono">
                                {Number(payment.amount).toLocaleString()} RWF
                                <div className="text-[10px] text-muted-foreground">
                                    of {Number(total).toLocaleString()} Total
                                </div>
                             </td>
                             <td className="p-4">
                                <Badge variant="outline" className={isPartial ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"}>
                                    {isPartial ? 'PARTIAL' : 'FULL'}
                                </Badge>
                             </td>
                             <td className="p-4 text-right">
                               <DownloadReceiptButton invoice={getReceiptData(payment)} variant="icon" />
                             </td>
                          </tr>
                        )})
                      )}
                  </tbody>
                </table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}