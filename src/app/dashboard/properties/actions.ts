'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- TYPES ---

type ActionResponse = {
  success: boolean
  message?: string
}

type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'

interface UnitUpdatePayload {
  unit_number: string
  floor_number: string
  rent_amount: number
  status?: UnitStatus
}

// --- ACTIONS ---

// 1. Create a Building
export async function createProperty(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const address = formData.get('address') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await (supabase.from('properties') as any).insert({
      name,
      address,
      created_by: user?.id
    })

    if (error) throw error

    revalidatePath('/dashboard/properties')
    return { success: true, message: "Property created successfully" }
  } catch (error) {
    console.error("Create Property Error:", error)
    return { success: false, message: "Failed to create property" }
  }
}

// 2. Add a Unit
export async function createUnit(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const property_id = formData.get('property_id') as string
  const unit_number = formData.get('unit_number') as string
  const floor_number = formData.get('floor_number') as string
  const rent_amount = formData.get('rent_amount') as string

  try {
    const { error } = await (supabase.from('units') as any).insert({
      property_id,
      unit_number,
      floor_number,
      rent_amount: parseFloat(rent_amount),
      status: 'VACANT'
    })

    if (error) throw error

    revalidatePath(`/dashboard/properties/${property_id}`)
    return { success: true, message: "Unit created successfully" }
  } catch (error) {
    console.error("Create Unit Error:", error)
    return { success: false, message: "Failed to create unit" }
  }
}

// 3. Delete Property
export async function deleteProperty(id: string): Promise<ActionResponse> {
  const supabase = await createClient()
  
  try {
    const { error } = await (supabase.from('properties') as any).delete().eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return { success: false, message: "Cannot delete: This property contains units. Delete the units first." }
      }
      throw error
    }

    revalidatePath('/dashboard/properties')
    return { success: true, message: "Property deleted successfully" }
  } catch (error) {
    console.error("Delete Property Error:", error)
    return { success: false, message: "Failed to delete property" }
  }
}

// 4. Edit Property
export async function updateProperty(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string

  try {
    const { error } = await (supabase.from('properties') as any)
      .update({ name, address })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/properties')
    return { success: true, message: "Property updated successfully" }
  } catch (error) {
    console.error("Update Property Error:", error)
    return { success: false, message: "Failed to update property" }
  }
}

// 5. Edit Unit (FIXED TYPE ERROR)
export async function updateUnit(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const unit_number = formData.get('unit_number') as string
  const floor_number = formData.get('floor_number') as string
  const rent_amount = formData.get('rent_amount') as string
  const status = formData.get('status') as UnitStatus | null
  const property_id = formData.get('property_id') as string

  // Strictly typed update object for logic safety
  const updates: UnitUpdatePayload = {
    unit_number,
    floor_number,
    rent_amount: parseFloat(rent_amount.replace(/,/g, ''))
  }

  if (status) {
    updates.status = status
  }

  try {
    const { error } = await (supabase.from('units') as any)
      .update(updates)
      .eq('id', id)

    if (error) throw error

    revalidatePath(`/dashboard/properties/${property_id}`)
    return { success: true, message: "Unit updated successfully" }
  } catch (error) {
    console.error("Update Unit Error:", error)
    return { success: false, message: "Failed to update unit" }
  }
}

// 6. Delete Unit
export async function deleteUnit(id: string, property_id: string): Promise<ActionResponse> {
  const supabase = await createClient()
  try {
    const { error } = await (supabase.from('units') as any).delete().eq('id', id)
    
    if (error) {
      if (error.code === '23503') {
        return { 
          success: false, 
          message: "Cannot delete: This unit is occupied or has lease history." 
        }
      }
      throw error
    }
    
    revalidatePath(`/dashboard/properties/${property_id}`)
    return { success: true, message: "Unit deleted successfully" }
  } catch (error) {
    console.error("Delete Unit Error:", error)
    return { success: false, message: "Failed to delete unit" }
  }
}