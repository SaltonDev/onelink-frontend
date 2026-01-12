'use client'

import { useState } from 'react'
import { generateMonthlyInvoices } from '@/app/dashboard/invoices/action'
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle } from "lucide-react"
import { toast } from "sonner"

interface GenerateButtonProps {
  onSuccess: () => void // This is critical
}

export function GenerateInvoiceButton({ onSuccess }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    
    toast.promise(generateMonthlyInvoices(), {
      loading: 'Checking lease records...',
      success: (data) => {
        setLoading(false)
        if (data.success) {
          // CALL THE PARENT REFRESH FUNCTION
          onSuccess() 
          return data.message
        } else {
          throw new Error(data.message)
        }
      },
      error: (err) => {
        setLoading(false)
        return `Error: ${err.message}`
      }
    })
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 text-white">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      {loading ? "Processing..." : "Generate Rent"}
    </Button>
  )
}