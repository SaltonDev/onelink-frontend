'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, RefreshCcw } from "lucide-react"

// --- LOCAL IMPORTS ---
import { CollectionsTable } from "@/components/dashboard/collections-table"
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog"
import { DownloadReceiptButton } from '@/components/documents/buttons/download-receipt-button'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const supabase = createClient()

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        leases (
          credit_balance,
          tenants (name, phone, email),
          units (unit_number, properties(name))
        )
      `)
      .order('due_date', { ascending: false }) // Initial fetch order

    if (!error && data) {
      setInvoices(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* --- PAGE HEADER --- */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoices & Collections</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collections">Collections (Unpaid)</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: COLLECTIONS (UNPAID) --- */}
        <TabsContent value="collections" className="space-y-4">
          <CollectionsTable 
            invoices={invoices.filter(i => i.status !== 'PAID' && i.status !== 'PARTIAL')} 
            onPaymentSuccess={fetchData}
          />
        </TabsContent>

        {/* --- TAB 2: HISTORY (PAID) --- */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-4 font-medium">Date Paid</th>
                      <th className="p-4 font-medium">Tenant</th>
                      <th className="p-4 font-medium">Unit</th>
                      <th className="p-4 font-medium">Amount Paid</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 text-right font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices
                      .filter(inv => inv.status === 'PAID' || inv.status === 'PARTIAL')
                      // ✅ SORT LOGIC: Most recent payment date first
                      .sort((a, b) => {
                        const dateA = new Date(a.payment_date || a.updated_at || a.created_at).getTime()
                        const dateB = new Date(b.payment_date || b.updated_at || b.created_at).getTime()
                        return dateB - dateA 
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            {inv.payment_date 
                              ? new Date(inv.payment_date).toLocaleDateString('en-GB') 
                              : new Date(inv.updated_at).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-4 font-medium">
                            {inv.leases?.tenants?.name}
                          </td>
                          <td className="p-4">
                            {inv.leases?.units?.unit_number}
                          </td>
                          <td className="p-4 font-mono">
                            {Number(inv.amount_paid || inv.amount).toLocaleString()} RWF
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              PAID
                            </Badge>
                          </td>
                          
                          {/* ✅ ACTION: Download Receipt */}
                          <td className="p-4 text-right">
                             <DownloadReceiptButton invoice={inv} variant="icon" />
                          </td>
                        </tr>
                      ))}

                    {/* EMPTY STATE */}
                    {invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No payment history available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}
      <CreateInvoiceDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}