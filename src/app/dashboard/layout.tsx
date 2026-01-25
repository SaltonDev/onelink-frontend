import { Sidebar } from "@/components/layout/sidebar"
// 1. IMPORT THE NEW COMPONENTS
import { AuthMonitor } from '@/components/global/auth-monitor'
import { NetworkStatus } from '@/components/global/network-status'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full relative bg-background min-h-screen">
      
      {/* 2. ADD THEM HERE - They protect everything below */}
      <AuthMonitor />
      <NetworkStatus />

      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar />
      </div>
      <main className="md:pl-72 pb-10">
        {/* We add a top padding here so content doesn't hit the top edge */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}