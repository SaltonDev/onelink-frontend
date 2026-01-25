'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Loader2, LockKeyhole } from "lucide-react"

export function AuthMonitor() {
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. Check Session on Mount
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!session || error) {
        triggerExpiration()
      }
    }

    // 2. Listen for Auth Changes (Sign out, Token refresh fail)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        triggerExpiration()
      }
    })

    checkSession()

    return () => subscription.unsubscribe()
  }, [])

  const triggerExpiration = () => {
    setOpen(true)
    
    // Start Countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleRedirect() // Auto-redirect when 0
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleRedirect = () => {
    router.push('/login') // Change this to your actual login route
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <LockKeyhole className="h-6 w-6 text-red-600" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Session Expired</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your security token is no longer valid. For your protection, please sign in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 text-sm text-muted-foreground font-medium">
           Redirecting in <span className="text-foreground font-bold">{countdown}</span> seconds...
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={handleRedirect} className="w-full">
            Return to Login Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}