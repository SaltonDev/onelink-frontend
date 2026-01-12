'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- TYPES ---
type ActionResponse = {
  success: boolean
  message: string
}

// 1. CREATE TENANT
export async function createTenant(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const national_id = formData.get('national_id') as string

  if (!name || !phone) {
    return { success: false, message: "Name and Phone are required" }
  }

  try {
    const { error } = await (supabase.from('tenants') as any).insert({
      name,
      phone,
      email: email || null,
      national_id: national_id || null,
      status: 'ACTIVE'
    })

    if (error) throw error

    revalidatePath('/dashboard/tenants')
    return { success: true, message: "Tenant created successfully" }
  } catch (error) {
    console.error("Create Tenant Error:", error)
    return { success: false, message: "Failed to create tenant" }
  }
}

// 2. UPDATE TENANT
export async function updateTenant(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const national_id = formData.get('national_id') as string

  try {
    const { error } = await (supabase.from('tenants') as any)
      .update({ name, phone, email: email || null, national_id: national_id || null })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/tenants')
    return { success: true, message: "Tenant updated successfully" }
  } catch (error) {
    console.error("Update Tenant Error:", error)
    return { success: false, message: "Failed to update tenant" }
  }
}

// 3. DELETE TENANT (Directly)
export async function deleteTenant(id: string): Promise<ActionResponse> {
  const supabase = await createClient()
  
  try {
    const { error } = await (supabase.from('tenants') as any).delete().eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return { success: false, message: "Cannot delete: Tenant has active leases or history." }
      }
      throw error
    }

    revalidatePath('/dashboard/tenants')
    return { success: true, message: "Tenant deleted successfully" }
  } catch (error) {
    console.error("Delete Tenant Error:", error)
    return { success: false, message: "Failed to delete tenant" }
  }
}

// 4. CREATE LEASE
export async function createLease(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  
  const tenant_id = formData.get('tenant_id') as string
  const unit_id = formData.get('unit_id') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string || null 
  const rent_amount = formData.get('rent_amount') as string

  try {
    const { error: leaseError } = await (supabase.from('leases') as any).insert({
      tenant_id,
      unit_id,
      start_date,
      end_date,
      rent_amount: parseFloat(rent_amount.replace(/,/g, '')),
      status: 'ACTIVE'
    })

    if (leaseError) throw leaseError

    await (supabase.from('units') as any).update({ status: 'OCCUPIED' }).eq('id', unit_id)

    revalidatePath('/dashboard/tenants')
    revalidatePath('/dashboard/properties')
    return { success: true, message: "Lease created successfully" }
  } catch (error) {
    console.error("Create Lease Error:", error)
    return { success: false, message: "Failed to create lease" }
  }
}

// 5. UPDATE LEASE
export async function updateLease(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const rent_amount = formData.get('rent_amount') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string || null

  try {
    const { error } = await (supabase.from('leases') as any)
      .update({ 
        rent_amount: parseFloat(rent_amount.replace(/,/g, '')),
        start_date,
        end_date
      })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/tenants')
    return { success: true, message: "Lease updated successfully" }
  } catch (error) {
    console.error("Update Lease Error:", error)
    return { success: false, message: "Failed to update lease" }
  }
}

// 6. TERMINATE LEASE (AGGRESSIVE CLEANUP)
export async function terminateLease(leaseId: string, unitId: string): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    // 1. Fetch Tenant ID before deletion
    const { data: lease } = await (supabase.from('leases') as any)
      .select('tenant_id')
      .eq('id', leaseId)
      .single()
    
    const tenantId = lease?.tenant_id

    // 2. DELETE FINANCIALS
    await (supabase.from('payments') as any).delete().eq('lease_id', leaseId)
    await (supabase.from('invoices') as any).delete().eq('lease_id', leaseId)

    // 3. DELETE LEASE
    const { error: leaseError } = await (supabase.from('leases') as any).delete().eq('id', leaseId)
    if (leaseError) throw leaseError

    // 4. FREE UNIT
    await (supabase.from('units') as any).update({ status: 'VACANT' }).eq('id', unitId)

    // 5. DELETE TENANT (Aggressive)
    if (tenantId) {
       await (supabase.from('tenants') as any).delete().eq('id', tenantId)
    } 

    revalidatePath('/dashboard/tenants')
    revalidatePath('/dashboard/properties')
    return { success: true, message: "Lease terminated and tenant removed." }
  } catch (error: any) {
    console.error("Terminate Error:", error)
    return { success: false, message: error.message || "Failed to terminate lease" }
  }
}

// 7. BULK TERMINATE LEASES (AGGRESSIVE CLEANUP)
export async function terminateBulkLeases(leaseIds: string[]): Promise<ActionResponse> {
  const supabase = await createClient()

  if (!leaseIds || leaseIds.length === 0) return { success: false, message: "No leases selected" }

  try {
    const { data: leases } = await (supabase.from('leases') as any)
      .select('id, unit_id, tenant_id')
      .in('id', leaseIds)

    if (!leases) return { success: false, message: "Leases not found" }

    await Promise.all(leases.map(async (lease: any) => {
      // A. Delete Financials
      await (supabase.from('payments') as any).delete().eq('lease_id', lease.id)
      await (supabase.from('invoices') as any).delete().eq('lease_id', lease.id)

      // B. Delete Lease
      await (supabase.from('leases') as any).delete().eq('id', lease.id)

      // C. Free Unit
      if (lease.unit_id) {
        await (supabase.from('units') as any).update({ status: 'VACANT' }).eq('id', lease.unit_id)
      }

      // D. Delete Tenant (Fixed: Now included in Bulk)
      if (lease.tenant_id) {
        await (supabase.from('tenants') as any).delete().eq('id', lease.tenant_id)
      }
    }))

    revalidatePath('/dashboard/tenants')
    revalidatePath('/dashboard/properties')
    return { success: true, message: `Terminated ${leases.length} leases & removed tenants` }
  } catch (error) {
    console.error("Bulk Terminate Error:", error)
    return { success: false, message: "Failed to terminate leases" }
  }
}

// 8. BULK DELETE TENANTS
export async function deleteBulkTenants(ids: string[]): Promise<ActionResponse> {
  const supabase = await createClient()
  
  if (!ids || ids.length === 0) return { success: false, message: "No tenants selected" }

  try {
    const { error } = await (supabase.from('tenants') as any).delete().in('id', ids)

    if (error) {
      if (error.code === '23503') {
        return { success: false, message: "Cannot delete: Tenants have active leases." }
      }
      throw error
    }

    revalidatePath('/dashboard/tenants')
    return { success: true, message: `Successfully deleted ${ids.length} tenants` }
  } catch (error) {
    console.error("Bulk Delete Error:", error)
    return { success: false, message: "Failed to delete selected tenants" }
  }
}