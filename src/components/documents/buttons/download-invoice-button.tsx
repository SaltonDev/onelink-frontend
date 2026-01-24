'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react' 
import { Button } from '@/components/ui/button'
import { generateInvoicePDF } from '@/utils/invoice-generator' // <--- IMPORT THE UTILITY

interface DownloadInvoiceButtonProps {
  invoice: any;
  variant?: "default" | "outline" | "ghost" | "icon";
}

export function DownloadInvoiceButton({ invoice, variant = "icon" }: DownloadInvoiceButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    
    try {
      // Small delay to show spinner (UX)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Call the robust generator
      generateInvoicePDF(invoice)
      
    } catch (error) {
      console.error("PDF Generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const isIcon = variant === "icon"

  return (
    <Button 
      variant="ghost" 
      size={isIcon ? "icon" : "sm"}
      onClick={handleDownload}
      disabled={isGenerating}
      title="Download Invoice PDF"
      className={isIcon ? "text-slate-500 hover:text-green-600" : "gap-2"}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {!isIcon && <span>Download PDF</span>}
    </Button>
  )
}