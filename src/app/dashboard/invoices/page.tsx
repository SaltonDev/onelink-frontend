'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { InvoiceManager } from '@/components/dashboard/invoice-manager'
import { CollectionsTable } from '@/components/dashboard/collections-table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Wallet, AlertCircle } from "lucide-react"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Fetch Invoices
    const { data: rawInvoices } = await supabase
      .from('invoices')
      .select(`*, leases(rent_amount, credit_balance, tenants(name, phone), units(unit_number, properties(name)))`)
      .order('due_date', { ascending: false })

    if (rawInvoices) {
      // 2. SELF-HEALING: Auto-tag Overdue
      // CRITICAL FIX: Only change 'PENDING' to 'OVERDUE'. 
      // Leave 'PARTIAL' alone so the Orange badge stays.
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const overdueIds = rawInvoices.filter((inv: any) => {
          const dueDate = new Date(inv.due_date)
          // Only auto-tag if purely PENDING. Keep Partials as Partials.
          return (inv.status === 'PENDING') && dueDate < today
      }).map((inv: any) => inv.id)

      if (overdueIds.length > 0) {
        await supabase.from('invoices').update({ status: 'OVERDUE' }).in('id', overdueIds)
        // Optimistic update
        rawInvoices.forEach((inv: any) => { 
            if (overdueIds.includes(inv.id)) inv.status = 'OVERDUE' 
        })
      }
      setInvoices(rawInvoices)
    }

    setLoading(false)
  }

  // --- FILTERS ---
  const drafts = invoices.filter(i => i.status === 'DRAFT')
  
  // 3. OVERDUE LOGIC (The Fix)
  // Include strictly OVERDUE items OR late PARTIAL items
  const overdueInvoices = invoices.filter(i => {
      const isLate = new Date(i.due_date) < new Date(new Date().setHours(0,0,0,0))
      return i.status === 'OVERDUE' || (i.status === 'PARTIAL' && isLate)
  })
  
  // 4. ACTIVE COLLECTIONS (Healthy)
  // Include PENDING or PARTIAL (but exclude the ones we just moved to Overdue list)
  const activeCollections = invoices.filter(i => {
      const isLate = new Date(i.due_date) < new Date(new Date().setHours(0,0,0,0))
      // If it's Partial but Late, it goes to Overdue tab, not here.
      if (i.status === 'PARTIAL' && isLate) return false
      return ['PENDING', 'PARTIAL'].includes(i.status)
  })

  // Calculate Totals
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.amount_paid || 0)), 0)
  const totalActiveAmount = activeCollections.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.amount_paid || 0)), 0)

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Cockpit</h2>
          <p className="text-gray-500">Billing pipeline and revenue tracking.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* DRAFTS */}
        <Card className="border-l-4 border-l-blue-500">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Drafts</CardTitle>
             <Clock className="h-4 w-4 text-blue-500" />
           </CardHeader>
           <CardContent><div className="text-2xl font-bold">{drafts.length}</div></CardContent>
        </Card>

        {/* OVERDUE */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/20">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-red-600">Overdue Invoices</CardTitle>
             <AlertCircle className="h-4 w-4 text-red-600" />
           </CardHeader>
           <CardContent>
               <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
               <p className="text-xs text-red-500 font-medium mt-1">Total: {totalOverdueAmount.toLocaleString()} RWF</p>
           </CardContent>
        </Card>

        {/* ACTIVE */}
        <Card className="border-l-4 border-l-green-500">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Active Collections</CardTitle>
             <Wallet className="h-4 w-4 text-green-600" />
           </CardHeader>
           <CardContent>
               <div className="text-2xl font-bold">{activeCollections.length}</div>
               <p className="text-xs text-gray-500 mt-1">Expected: {totalActiveAmount.toLocaleString()} RWF</p>
           </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={overdueInvoices.length > 0 ? "overdue" : "collections"} className="space-y-4"> 
        <TabsList>
          <TabsTrigger value="approvals">Approvals ({drafts.length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({activeCollections.length})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
             Overdue ({overdueInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <InvoiceManager initialInvoices={drafts} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="collections">
           <CollectionsTable invoices={activeCollections} onPaymentSuccess={fetchData} />
        </TabsContent>

        <TabsContent value="overdue">
           <Card className="border-red-100 shadow-none">
              <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Priority Action Required
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <CollectionsTable invoices={overdueInvoices} onPaymentSuccess={fetchData} />
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}