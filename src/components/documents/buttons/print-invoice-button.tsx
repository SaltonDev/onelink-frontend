'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react' 
import { Button } from '@/components/ui/button'
import { InvoiceA4 } from '../templates/invoice-a4'

interface PrintInvoiceButtonProps {
  invoice: any;
  variant?: "default" | "outline" | "ghost" | "icon"; // Scalable: allow different styles
}

export function PrintInvoiceButton({ invoice, variant = "icon" }: PrintInvoiceButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef, 
    documentTitle: `Invoice-${invoice.leases?.tenants?.name}-${invoice.id.slice(0,6)}`,
  })

  // Variant Logic: Icon-only vs Text Button
  const isIcon = variant === "icon"

  return (
    <>
      <Button 
        variant="ghost" 
        size={isIcon ? "icon" : "sm"}
        onClick={() => handlePrint()}
        title="Download Invoice PDF"
        className={isIcon ? "text-slate-500 hover:text-blue-600" : "gap-2"}
      >
        <Printer className="w-4 h-4" />
        {!isIcon && <span>Print Invoice</span>}
      </Button>

      {/* Hidden Print Container */}
      <div className="hidden">
        <InvoiceA4 ref={contentRef} invoice={invoice} />
      </div>
    </>
  )
}