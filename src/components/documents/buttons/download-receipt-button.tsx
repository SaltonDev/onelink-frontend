'use client'

import { useState } from 'react'
import { FileCheck, Loader2 } from 'lucide-react' 
import { Button } from '@/components/ui/button'
import { generateReceiptPDF } from '@/utils/receipt-generator'

interface DownloadReceiptButtonProps {
  invoice: any;
  variant?: "default" | "outline" | "ghost" | "icon";
}

export function DownloadReceiptButton({ invoice, variant = "icon" }: DownloadReceiptButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    
    try {
      // Small delay for UX so user sees something happened
      await new Promise(resolve => setTimeout(resolve, 500)) 
      generateReceiptPDF(invoice)
    } catch (error) {
      console.error("Receipt Generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const isIcon = variant === "icon"

  return (
    <Button 
      variant={isIcon ? "ghost" : variant} 
      size={isIcon ? "icon" : "sm"}
      onClick={handleDownload}
      disabled={isGenerating}
      title="Download Official Receipt"
      className={isIcon ? "text-slate-400 hover:text-green-600" : "gap-2"}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileCheck className="w-4 h-4" />
      )}
      {!isIcon && <span>Download Receipt</span>}
    </Button>
  )
}