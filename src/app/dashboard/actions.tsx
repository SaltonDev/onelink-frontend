'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()

  try {
    // 1. Run all queries in PARALLEL for speed
    const [
      { count: totalUnits },
      { count: occupiedUnits },
      { count: totalTenants },
      { data: leases },
      { data: financialMetrics }
    ] = await Promise.all([
      supabase.from('units').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'OCCUPIED'),
      supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      
      // Get Expiring Leases (Next 60 days)
      supabase.from('leases')
        .select('*, tenants(name, phone), units(unit_number, properties(name))')
        .eq('status', 'ACTIVE')
        .lte('end_date', new Date(new Date().setDate(new Date().getDate() + 60)).toISOString()) 
        .order('end_date', { ascending: true })
        .limit(5),

      // Get This Month's Financials
      supabase.from('invoices')
        .select('amount, amount_paid, status')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    // 2. Calculate Occupancy %
    const occupancyRate = totalUnits ? Math.round((occupiedUnits || 0) / totalUnits * 100) : 0

    // 3. Calculate Financials
    // FIX: Added ': any' to 'inv' so TypeScript stops complaining about missing types
    const totalExpected = financialMetrics?.reduce((sum, inv: any) => sum + Number(inv.amount), 0) || 0
    const totalCollected = financialMetrics?.reduce((sum, inv: any) => sum + Number(inv.amount_paid), 0) || 0
    
    const collectionRate = totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0

    return {
      stats: {
        totalUnits: totalUnits || 0,
        occupiedUnits: occupiedUnits || 0,
        occupancyRate,
        totalTenants: totalTenants || 0,
        financials: {
          expected: totalExpected,
          collected: totalCollected,
          rate: collectionRate
        }
      },
      expiringLeases: leases || []
    }

  } catch (error) {
    console.error("Dashboard Error:", error)
    return null
  }
}