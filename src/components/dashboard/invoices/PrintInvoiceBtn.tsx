'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, FileText } from 'lucide-react' 
import { Button } from '@/components/ui/button'
import { InvoiceTemplate } from './InvoiceTemplate' // The new "Demand for Payment"
import { ReceiptTemplate } from './ReceiptTemplate' // The "Proof of Payment"

export function PrintInvoiceBtn({ invoice }: { invoice: any }) {
  const contentRef = useRef<HTMLDivElement>(null)
  
  // LOGIC: 
  // PAID/PARTIAL -> Use Receipt Template
  // PENDING/OVERDUE/DRAFT -> Use Invoice Template
  const isPaid = invoice.status === 'PAID' || invoice.status === 'PARTIAL'
  
  const docTitle = isPaid 
    ? `Receipt-${invoice.leases?.tenants?.name}`
    : `Invoice-${invoice.leases?.tenants?.name}`

  const handlePrint = useReactToPrint({
    contentRef, 
    documentTitle: docTitle,
  })

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handlePrint()}
        title={isPaid ? "Download Receipt" : "Download Invoice"}
      >
        {isPaid ? (
            <FileText className="w-4 h-4 text-green-600 hover:text-green-700" />
        ) : (
            <Printer className="w-4 h-4 text-gray-500 hover:text-blue-600" />
        )}
      </Button>

      <div className="hidden">
        {isPaid ? (
            <ReceiptTemplate ref={contentRef} invoice={invoice} />
        ) : (
            <InvoiceTemplate ref={contentRef} invoice={invoice} />
        )}
      </div>
    </>
  )
}