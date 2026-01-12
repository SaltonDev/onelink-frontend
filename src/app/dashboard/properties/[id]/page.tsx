import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { AddUnitModal } from '@/components/modals/add-unit-modal'
import { UnitListClient } from '@/components/dashboard/unit-list-client' // <--- IMPORT CLIENT LIST
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Home, Users } from "lucide-react"
import Link from 'next/link'

// Define Types
interface Unit {
  id: string
  unit_number: string
  floor_number: string
  rent_amount: number
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
  property_id: string
}

interface Property {
  id: string
  name: string
  address: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailsPage(props: PageProps) {
  const params = await props.params
  const id = params.id
  const supabase = await createClient()

  // 1. FETCH DATA
  const { data: propertyData } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!propertyData) return notFound()

  const { data: unitsData } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', id)
    .order('unit_number', { ascending: true })

  // Type Casting
  const property = propertyData as Property
  const units = (unitsData || []) as Unit[]

  // Stats
  const totalUnits = units.length
  const occupiedUnits = units.filter(u => u.status === 'OCCUPIED').length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{property.name}</h2>
          <p className="text-gray-500 flex items-center gap-2">
             <Building2 className="h-3 w-3" /> 
             {property.address || 'No address set'}
          </p>
        </div>
        <div className="ml-auto">
          {/* Add Modal stays here for global access */}
          <AddUnitModal propertyId={property.id} />
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">{occupiedUnits} occupied</p>
          </CardContent>
        </Card>
      </div>

      {/* INTERACTIVE UNIT LIST */}
      <UnitListClient units={units} />

    </div>
  )
}