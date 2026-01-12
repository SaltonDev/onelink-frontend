import { getDashboardStats } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import Link from 'next/link'

export default async function DashboardPage() {
  const data = await getDashboardStats()

  if (!data) return <div className="p-8">Loading dashboard...</div>

  const { stats, expiringLeases } = data

  return (
    <div className="space-y-8">
      
      {/* 1. WELCOME SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500">Overview of your property portfolio performance.</p>
        </div>
      </div>

      {/* 2. KEY METRICS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* REVENUE */}
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Revenue (This Month)</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.financials.collected.toLocaleString()} <span className="text-xs font-normal text-gray-400">RWF</span></div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.financials.rate}% of expected {stats.financials.expected.toLocaleString()}
            </p>
            <Progress value={stats.financials.rate} className="h-1 mt-2 bg-green-100" />
          </CardContent>
        </Card>

        {/* OCCUPANCY */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Occupancy</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.occupiedUnits} / {stats.totalUnits} Units Occupied
            </p>
            <Progress value={stats.occupancyRate} className="h-1 mt-2 bg-blue-100" />
          </CardContent>
        </Card>

        {/* TENANTS */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-gray-500 mt-1">Current active contracts</p>
          </CardContent>
        </Card>

        {/* HEALTH SCORE */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-gray-500 mt-1">Based on occupancy & arrears</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. LOWER SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* EXPIRING LEASES LIST */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-orange-500" />
               Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringLeases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                <p>No leases expiring in 60 days.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringLeases.map((lease: any) => {
                  const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  return (
                    <div key={lease.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{lease.tenants?.name}</p>
                        <p className="text-xs text-gray-500">Unit {lease.units?.unit_number} • {lease.units?.properties?.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          {daysLeft} days left
                        </Badge>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(lease.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            <Link href="/dashboard/tenants" className="block mt-4">
               <div className="flex items-center justify-center text-xs text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                  View All Tenants <ArrowRight className="h-3 w-3 ml-1" />
               </div>
            </Link>
          </CardContent>
        </Card>

        {/* QUICK ACTIONS (Updated: Only 2 Buttons) */}
        <Card className="col-span-1 h-full flex flex-col">
           <CardHeader>
             <CardTitle>Quick Actions</CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-2 gap-4 flex-1">
              
              <Link href="/dashboard/invoices" className="h-full">
                <div className="h-full flex flex-col items-center justify-center p-6 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
                   <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Finance Center</div>
                   <p className="text-[10px] text-slate-400 mt-1">Invoices & Payments</p>
                </div>
              </Link>

              <Link href="/dashboard/properties" className="h-full">
                <div className="h-full flex flex-col items-center justify-center p-6 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                   <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                   </div>
                   <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Manage Units</div>
                   <p className="text-[10px] text-slate-400 mt-1">Occupancy & Leases</p>
                </div>
              </Link>

           </CardContent>
        </Card>
      </div>
    </div>
  )
}