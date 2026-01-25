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
import { Clock, Wallet, AlertCircle, FileDown } from "lucide-react"
// IMPORT THE NEW GENERATOR
import { generateStatementPDF } from '@/utils/statement-generator'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: rawInvoices, error } = await supabase
      .from('invoices')
      .select(`*, leases(credit_balance, tenants(name, phone), units(unit_number, properties(name)))`)
      .order('due_date', { ascending: false })

    if (error || !rawInvoices) {
      setLoading(false)
      return
    }

    // SELF-HEALING Logic
    const today = new Date()
    today.setHours(0, 0, 0, 0) 
    const overdueIds = rawInvoices.filter((inv: any) => {
        const dueDate = new Date(inv.due_date)
        return inv.status === 'PENDING' && dueDate < today
    }).map((inv: any) => inv.id)

    if (overdueIds.length > 0) {
      await supabase.from('invoices').update({ status: 'OVERDUE' }).in('id', overdueIds)
      rawInvoices.forEach((inv: any) => { if (overdueIds.includes(inv.id)) inv.status = 'OVERDUE' })
    }
    
    setInvoices(rawInvoices)
    setLoading(false)
  }

  // --- EXPORT HISTORY FUNCTION (Fixed Date Format) ---
  const exportHistoryPDF = () => {
    const paidInvoices = invoices.filter(i => i.status === 'PAID')
    
    const tableData = paidInvoices.map(inv => [
      // FIX 1: Force dd/mm/yyyy in PDF
      new Date(inv.payment_date || inv.created_at).toLocaleDateString('en-GB'),
      inv.leases?.tenants?.name || 'Unknown',
      inv.leases?.units?.unit_number || '-',
      Number(inv.amount).toLocaleString() + ' RWF'
    ])

    generateStatementPDF({
        title: "Finance Payment Report",
        subtitle: "Full Transaction History",
        entityInfo: [
            `Total Collected: ${paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()} RWF`,
            `Records: ${paidInvoices.length}`
        ],
        columns: ['Date Paid', 'Tenant', 'Unit', 'Amount'],
        data: tableData,
        filename: 'OneLink_Finance_Report.pdf'
    })
  }

  // --- STATS ---
  const drafts = invoices.filter(i => i.status === 'DRAFT')
  const overdue = invoices.filter(i => i.status === 'OVERDUE')
  const pending = invoices.filter(i => ['PENDING', 'PARTIAL'].includes(i.status))
  const collectionsList = [...overdue, ...pending]

  const totalReceivable = collectionsList.reduce((sum, inv) => {
    return sum + (Number(inv.amount) - Number(inv.amount_paid || 0))
  }, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /></div></div>
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => (<Skeleton key={i} className="h-32 w-full" />))}</div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{drafts.length}</div></CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Total Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{totalReceivable.toLocaleString()} RWF</div></CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections Queue</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pending.length}</div></CardContent>
        </Card>
      </div>

      {/* MAIN INTERFACE */}
      <Tabs defaultValue="collections" className="space-y-4"> 
        <TabsList>
          <TabsTrigger value="approvals">Approvals ({drafts.length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({collectionsList.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <InvoiceManager initialInvoices={drafts} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="collections">
           <CollectionsTable invoices={collectionsList} onPaymentSuccess={fetchData} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payment Archive</CardTitle>
                <Button variant="outline" size="sm" onClick={exportHistoryPDF} className="gap-2">
                    <FileDown className="h-4 w-4" /> Export Statement
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
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                      {invoices
                        .filter(i => i.status === 'PAID')
                        .sort((a, b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime())
                        .map(inv => (
                          <tr key={inv.id} className="hover:bg-muted/50">
                             {/* FIX 2: Force dd/mm/yyyy in UI Table */}
                             <td className="p-4">{new Date(inv.payment_date || inv.created_at).toLocaleDateString('en-GB')}</td>
                             <td className="p-4">{inv.leases?.tenants?.name}</td>
                             <td className="p-4">{inv.leases?.units?.unit_number}</td>
                             <td className="p-4 font-mono">{Number(inv.amount).toLocaleString()}</td>
                             <td className="p-4"><Badge variant="outline" className="text-green-600 bg-green-50">PAID</Badge></td>
                             <td className="p-4 text-right">
                               <DownloadReceiptButton invoice={inv} variant="icon" />
                             </td>
                          </tr>
                        ))}
                      {invoices.filter(i => i.status === 'PAID').length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payment history yet.</td></tr>
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