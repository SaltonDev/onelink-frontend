import { createClient } from '@/utils/supabase/server'
import { SettingsClient } from '@/components/dashboard/settings-client'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      
      <SettingsClient user={user} />
    </div>
  )
}