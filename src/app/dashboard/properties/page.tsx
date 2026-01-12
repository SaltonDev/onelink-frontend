import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, MapPin } from "lucide-react" 
import { AddPropertyModal } from '@/components/modals/add-property-modal'
import { PropertyActions } from '@/components/dashboard/property-actions'
import { Search } from '@/components/dashboard/search'

// 1. DEFINING THE SHAPE OF OUR DATA
interface Property {
  id: string
  name: string
  address: string | null
  created_at: string
  units: { count: number }[] // Result from the count join
}

export default async function PropertiesPage(props: { 
  searchParams?: Promise<{ query?: string }> 
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ''
  const supabase = await createClient()

  // 2. FETCH DATA
  let queryBuilder = supabase
    .from('properties')
    .select('*, units(count)')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`)
  }

  const { data: rawProperties } = await queryBuilder

  // 3. APPLY TYPE CASTING (Fixes the 'never' error)
  const safeProperties = (rawProperties ?? []) as unknown as Property[]

  // 4. CALCULATE STATS
  const totalProperties = safeProperties.length
  
  const totalUnits = safeProperties.reduce((sum, property) => {
    // Now TypeScript knows property.units exists!
    return sum + (property.units?.[0]?.count || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
          <p className="text-gray-500">Manage your property portfolio</p>
        </div>
        <AddPropertyModal />
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">Active buildings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">Available across portfolio</p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-sm">
        <Search placeholder="Search properties..." />
      </div>

      {/* PROPERTY LIST */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {safeProperties.map((property) => {
          const unitCount = property.units?.[0]?.count || 0

          return (
            <Card key={property.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{property.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {property.address || "No address"}
                    </div>
                  </div>
                </div>

                <PropertyActions property={property} />

              </CardHeader>
              <CardContent>
                <div className="mt-4 flex items-center justify-between text-sm">
                   <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-medium text-xs">
                     {unitCount} {unitCount === 1 ? 'Unit' : 'Units'}
                   </span>
                   <span className="text-green-600 dark:text-green-400 font-medium text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                     Active
                   </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {safeProperties.length === 0 && (
          <div className="col-span-full text-center py-12">
             {query ? (
               <div className="text-gray-500">
                 <p className="font-medium">No results found for "{query}"</p>
                 <p className="text-sm">Try checking for typos or searching for a different building.</p>
               </div>
             ) : (
               <p className="text-gray-500">No properties found. Click "Add Property" to start.</p>
             )}
          </div>
        )}
      </div>
    </div>
  )
}