import { createClient } from '@/utils/supabase/server'
import { TenantHistoryClient } from './tenant-history-client' // <--- CHANGED IMPORT
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Phone, Mail, Fingerprint, Wallet, AlertCircle } from "lucide-react"
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantProfilePage(props: PageProps) {
  const params = await props.params
  const id = params.id
  const supabase = await createClient()

  // 1. FETCH TENANT
  const { data: tenant } = await (supabase.from('tenants') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!tenant) return <div className="p-8">Tenant not found</div>

  // 2. FETCH LEASE IDs
  const { data: leases } = await (supabase.from('leases') as any)
    .select('id')
    .eq('tenant_id', id)
  
  const leaseIds = leases?.map((l: any) => l.id) || []

  // 3. FETCH RAW PAYMENTS (The Ledger)
  let paymentHistory: any[] = []

  if (leaseIds.length > 0) {
    const { data: payments } = await (supabase.from('payments') as any)
      .select(`
        *,
        invoices ( 
          id, amount, due_date, status,
          leases ( units ( unit_number ) ) 
        ),
        leases (
          units ( 
            unit_number, 
            properties ( name ) 
          )
        )
      `)
      .in('lease_id', leaseIds)
      .order('payment_date', { ascending: false })
      
    paymentHistory = payments || []
  }

  // Calculate Lifetime Total
  const totalPaid = paymentHistory.reduce((sum, p) => {
    // Only count REAL money (exclude wallet usage to avoid double counting if you treat wallet as internal)
    // However, usually 'Total Paid' means 'Total Value Transferred'. 
    // If you want purely CASH in, filter by method !== 'WALLET'
    return p.method !== 'WALLET' ? sum + Number(p.amount) : sum
  }, 0)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tenants">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
           <h1 className="text-2xl font-bold">{tenant.name}</h1>
           <div className="flex items-center gap-2 text-gray-500 text-sm">
             <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {tenant.phone}</span>
             {tenant.email && <span className="flex items-center gap-1"> • <Mail className="h-3 w-3" /> {tenant.email}</span>}
           </div>
        </div>
        <div className="ml-auto">
           <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status}</Badge>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid md:grid-cols-4 gap-4">
         <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500 uppercase">Lifetime Cash Paid</CardTitle></CardHeader>
            <CardContent>
               <div className="text-2xl font-bold font-mono text-green-700">
                 {totalPaid.toLocaleString()} RWF
               </div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500 uppercase">Total Transactions</CardTitle></CardHeader>
            <CardContent>
               <div className="flex items-center gap-2">
                 <Wallet className="h-5 w-5 text-blue-500" />
                 <span className="text-2xl font-bold">{paymentHistory.length}</span>
               </div>
            </CardContent>
         </Card>
         <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500 uppercase">Identity</CardTitle></CardHeader>
            <CardContent className="flex gap-6">
                <div className="flex items-center gap-2">
                   <Fingerprint className="h-4 w-4 text-gray-400" /> 
                   <span className="font-mono text-sm">{tenant.national_id || 'No ID Recorded'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <User className="h-4 w-4 text-gray-400" /> 
                   <span className="text-sm text-gray-500">System ID: {tenant.id.slice(0, 8)}...</span>
                </div>
            </CardContent>
         </Card>
      </div>

      {/* NEW HISTORY COMPONENT */}
      <TenantHistoryClient payments={paymentHistory} tenantName={tenant.name} />

    </div>
  )
}