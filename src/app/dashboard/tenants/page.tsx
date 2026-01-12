import { createClient } from '@/utils/supabase/server'
import { TenantListClient } from '@/components/dashboard/tenant-list-client'
import { LeaseListClient } from '@/components/dashboard/lease-list-client'
import { AddTenantModal } from '@/components/modals/add-tenants-modal'
import { CreateLeaseModal } from '@/components/modals/create-lease-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, AlertTriangle } from "lucide-react"

export default async function TenantsPage() {
  const supabase = await createClient()

  // 1. FETCH TENANTS (With Nested properties for the filter)
  const { data: tenantsData } = await (supabase.from('tenants') as any)
    .select(`
      *, 
      leases(
        status, 
        end_date, 
        units(
          unit_number, 
          properties(name)
        )
      )
    `)
    .order('created_at', { ascending: false })

  const safeTenants = (tenantsData || [])

  // 2. FETCH ALL ACTIVE LEASES
  const { data: leasesData } = await (supabase.from('leases') as any)
    .select('*, tenants(*), units(unit_number, properties(name))')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

  const allActiveLeases = (leasesData || [])

  // 3. EXTRACT PROPERTIES FOR FILTER
  const propertySet = new Set<string>()
  
  safeTenants.forEach((t: any) => {
    const activeLease = t.leases?.find((l: any) => l.status === 'ACTIVE')
    if (activeLease?.units?.properties?.name) {
      propertySet.add(activeLease.units.properties.name)
    }
  })
  
  allActiveLeases.forEach((l: any) => {
    if(l.units?.properties?.name) propertySet.add(l.units.properties.name)
  })

  const uniqueProperties = Array.from(propertySet).sort()

  // 4. SPLIT LEASES (Expiring vs Healthy)
  const expiringLeases = allActiveLeases.filter((lease: any) => {
    if (!lease.end_date) return false // Indefinite never expires
    const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    return daysLeft >= 0 && daysLeft <= 30
  })

  // Healthy = Active leases that are NOT in the expiring list
  const healthyLeases = allActiveLeases.filter((lease: any) => {
     return !expiringLeases.find((e: any) => e.id === lease.id)
  })

  // 5. VACANT UNITS
  const { data: vacantUnits } = await (supabase.from('units') as any)
    .select('id, unit_number, rent_amount, properties(name)')
    .eq('status', 'VACANT')
  
  const formattedVacantUnits = (vacantUnits || []).map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    rent_amount: u.rent_amount,
    property_name: u.properties?.name || 'Unknown'
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenants & Leases</h2>
          <p className="text-gray-500">Manage your residents and contracts.</p>
        </div>
        <div className="flex gap-2">
            <AddTenantModal />
            <CreateLeaseModal tenants={safeTenants} vacantUnits={formattedVacantUnits} />
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{safeTenants.length}</div></CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Show Total (Healthy + Expiring) here for high-level overview */}
            <div className="text-2xl font-bold">{allActiveLeases.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expiringLeases.length > 0 ? 'text-orange-600' : ''}`}>
              {expiringLeases.length}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 Days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <div className="border-b">
           <TabsList className="bg-transparent p-0 h-auto space-x-6">
              <TabsTrigger value="directory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-0 py-2">
                 All Tenants
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-0 py-2">
                 Active Leases 
                 {/* Badge shows Count of Healthy Leases only */}
                 <Badge variant="secondary" className="ml-2 h-5 px-1.5">{healthyLeases.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expiring" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 px-0 py-2">
                 Expiring Soon
                 {expiringLeases.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 bg-orange-600">{expiringLeases.length}</Badge>}
              </TabsTrigger>
           </TabsList>
        </div>

        <TabsContent value="directory" className="space-y-4">
           <TenantListClient tenants={safeTenants} properties={uniqueProperties} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
           {/* PASSING ONLY HEALTHY LEASES */}
           <LeaseListClient leases={healthyLeases} properties={uniqueProperties} type="ACTIVE" />
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
           {/* PASSING ONLY EXPIRING LEASES */}
           <LeaseListClient leases={expiringLeases} properties={uniqueProperties} type="EXPIRING" />
        </TabsContent>
      </Tabs>
    </div>
  )
}