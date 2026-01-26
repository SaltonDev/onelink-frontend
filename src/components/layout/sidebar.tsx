'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from "next-themes"
import { LayoutDashboard, Building2, Users, Wallet, History, LogOut, Moon, Sun, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: "text-sky-500" },
  { label: 'Properties & Units', icon: Building2, href: '/dashboard/properties', color: "text-violet-500" },
  { label: 'Tenants & Leases', icon: Users, href: '/dashboard/tenants', color: "text-pink-700" },
  { label: 'Finance', icon: Wallet, href: '/dashboard/invoices', color: "text-emerald-500" },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: "text-orange-500" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { setTheme, theme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-slate-800">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative h-8 w-8 mr-4 bg-blue-600 rounded-lg flex items-center justify-center">
             <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">OneLink</h1>
            <p className="text-xs text-slate-400">Team Access</p>
          </div>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="px-3 py-2 border-t border-slate-800">
        <button 
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="flex items-center p-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer w-full transition"
>
  <Sun className="h-5 w-5 mr-3 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-5 w-5 mr-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
  <span className="ml-2">Switch Theme</span>
</button>
        <button 
          onClick={handleLogout}
          className="flex items-center p-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer w-full transition"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  )
}