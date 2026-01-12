'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // This tells Supabase: "When they click the link, send them to this hidden route"
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) return { error: error.message }
  return { success: "Check your email for the reset link!" }
}