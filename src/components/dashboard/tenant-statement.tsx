'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Download, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Invoice {
  id: string
  invoice_id: string // Need this for deduplication
  due_date: string
  payment_date: string | null
  amount: number // This will now be the FULL Invoice Amount
  amount_paid: number // This is the TRANSACTION Amount
  status: string
  lateText?: string
  leases: {
    units: {
      unit_number: string
    }
  }
}

export function TenantStatement({ invoices, tenantName }: { invoices: Invoice[], tenantName: string }) {
  
  // --- 1. PROCESS STATUS & LATE LOGIC ---
  const processedData = invoices.map(inv => {
    const dueDate = new Date(inv.due_date)
    const payDate = inv.payment_date ? new Date(inv.payment_date) : new Date()
    const diffTime = payDate.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let statusLabel = 'PAID'
    let statusColor = 'bg-green-100 text-green-800'
    let lateText = ''

    // Logic: If payment was late
    if (diffDays > 0) {
      statusLabel = 'LATE'
      statusColor = 'bg-red-100 text-red-800'
      lateText = `(${diffDays} days late)`
    } else if (diffDays < -5) {
      statusLabel = 'EARLY'
      statusColor = 'bg-blue-100 text-blue-800'
    }

    return { ...inv, statusLabel, statusColor, lateText }
  })

  // --- 2. CALCULATE TOTALS (DEDUPLICATED) ---
  // We sum "Amount Paid" normally (sum of all transactions)
  const totalPaid = processedData.reduce((sum, i) => sum + Number(i.amount_paid), 0)
  
  // We sum "Total Billed" by counting each Unique Invoice ID only once
  const uniqueInvoices = new Map()
  processedData.forEach(item => {
    if (!uniqueInvoices.has(item.invoice_id)) {
      uniqueInvoices.set(item.invoice_id, Number(item.amount))
    }
  })
  const totalBilled = Array.from(uniqueInvoices.values()).reduce((sum, val) => sum + val, 0)
  
  const balance = totalBilled - totalPaid

  // --- 3. PDF EXPORT ---
  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Tenant Statement", 14, 20)
    doc.setFontSize(12)
    doc.text(`Tenant: ${tenantName}`, 14, 30)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36)

    const tableRows = processedData.map(row => [
      new Date(row.due_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      row.leases.units.unit_number,
      new Date(row.payment_date || new Date()).toLocaleDateString(),
      `${Number(row.amount).toLocaleString()}`,     // Invoice Total
      `${Number(row.amount_paid).toLocaleString()}`, // Amount Paid
      row.statusLabel,
      row.lateText
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Month', 'Unit', 'Date Paid', 'Invoice Total', 'Paid Amount', 'Status', 'Notes']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Total Billed: ${totalBilled.toLocaleString()} RWF`, 14, finalY)
    doc.text(`Total Paid:   ${totalPaid.toLocaleString()} RWF`, 14, finalY + 6)
    doc.text(`Balance Due:  ${balance.toLocaleString()} RWF`, 14, finalY + 12)

    doc.save(`${tenantName}_Statement.pdf`)
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Statement & History
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Full breakdown of payments.</p>
        </div>
        <Button onClick={generatePDF} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="rounded-md border-t">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Billing Month</TableHead>
                <TableHead>Date Paid</TableHead>
                <TableHead>Invoice Total</TableHead> {/* Renamed from "Expected" */}
                <TableHead>Paid Amount</TableHead>   {/* Renamed from "Paid" */}
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    <div className="text-[10px] text-gray-400">Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                     <span className="font-mono text-xs">{inv.payment_date ? new Date(inv.payment_date).toLocaleDateString() : '-'}</span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {Number(inv.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-bold">
                    {Number(inv.amount_paid).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 ${inv.statusColor}`}>
                      {inv.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {inv.statusLabel === 'LATE' && (
                      <div className="flex items-center gap-1 text-red-600 font-medium">
                        <Clock className="h-3 w-3" /> {inv.lateText}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* FOOTER TOTALS */}
          <div className="bg-slate-50 p-4 border-t flex justify-end gap-8 text-sm">
             <div>
               <p className="text-gray-500 text-xs uppercase">Total Billed</p>
               <p className="font-bold text-gray-900">{totalBilled.toLocaleString()} RWF</p>
             </div>
             <div>
               <p className="text-gray-500 text-xs uppercase">Total Paid</p>
               <p className="font-bold text-green-600">{totalPaid.toLocaleString()} RWF</p>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}