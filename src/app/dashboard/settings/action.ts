'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  try {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error

    revalidatePath('/dashboard/settings')
    return { 
      success: true, 
      message: "Confirmation link sent to both old and new email addresses." 
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirmPassword') as string

  if (password !== confirm) {
    return { success: false, message: "Passwords do not match" }
  }

  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" }
  }

  try {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error

    revalidatePath('/dashboard/settings')
    return { success: true, message: "Password updated successfully" }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}