'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000) // Hide "Back Online" after 3s
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-y-0",
      isOffline ? "bg-red-600 text-white" : "bg-green-600 text-white"
    )}>
      {isOffline ? (
        <>
          <WifiOff className="h-5 w-5 animate-pulse" />
          <div className="flex flex-col">
             <span className="font-bold text-sm">No Connection</span>
             <span className="text-xs opacity-90">Please check your internet.</span>
          </div>
        </>
      ) : (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-bold text-sm">Back Online</span>
        </>
      )}
    </div>
  )
}