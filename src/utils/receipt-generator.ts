import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateReceiptPDF = (invoice: any) => {
  const doc = new jsPDF()

  // --- BRANDING & HEADER ---
  doc.setFontSize(20)
  doc.text("UMUYENZI PLAZA", 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("KN 5 Rd, Remera, Kigali", 14, 28)
  doc.text("Phone: +250 788 000 000", 14, 33)

  // --- RECEIPT LABEL (Right Side) ---
  doc.setFontSize(24)
  doc.setTextColor(16, 185, 129) // Emerald Green
  doc.text("RECEIPT", 140, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text(`Receipt #: REC-${invoice.id.slice(0, 6).toUpperCase()}`, 140, 30)
  
  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB')
    
  doc.text(`Date Paid: ${paymentDate}`, 140, 35)

  // --- WATERMARK (The "PAID" Stamp) ---
  doc.saveGraphicsState()
  doc.setTextColor(220, 252, 231) // Very light green
  doc.setFontSize(60)
  doc.text("PAID", 105, 120, { align: 'center', angle: 45 })
  doc.restoreGraphicsState()

  // --- RECEIVED FROM ---
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Received From:", 14, 55)
  
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(invoice.leases?.tenants?.name || "Unknown Tenant", 14, 62)
  
  doc.setFontSize(10)
  doc.text(`Unit: ${invoice.leases?.units?.unit_number}`, 14, 67)

  // --- AMOUNT BOX (Right Side) ---
  doc.setDrawColor(16, 185, 129) // Green Border
  doc.setFillColor(236, 253, 245) // Green Background
  doc.roundedRect(140, 50, 50, 20, 1, 1, 'FD') 
  
  doc.setFontSize(8)
  doc.setTextColor(21, 128, 61) // Dark Green
  doc.text("TOTAL PAID", 145, 56)
  
  doc.setFontSize(14)
  doc.text(`${Number(invoice.amount_paid).toLocaleString()} RWF`, 145, 65)

  // --- TABLE ---
  const rentPeriod = new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })
  
  autoTable(doc, {
    startY: 85,
    head: [['Payment For', 'Period', 'Amount']],
    body: [
      [
        `Rent Payment - Unit ${invoice.leases?.units?.unit_number}`, 
        rentPeriod, 
        `${Number(invoice.amount).toLocaleString()} RWF`
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [21, 128, 61], textColor: 255 }, // Green Header
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // --- BALANCES ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10
  const balance = Number(invoice.amount) - Number(invoice.amount_paid)

  // Summary Lines
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Total Invoice:", 140, finalY)
  doc.setTextColor(0)
  doc.text(`${Number(invoice.amount).toLocaleString()} RWF`, 195, finalY, { align: 'right' })

  doc.setTextColor(21, 128, 61) // Green
  doc.text("Amount Paid:", 140, finalY + 6)
  doc.text(`- ${Number(invoice.amount_paid).toLocaleString()} RWF`, 195, finalY + 6, { align: 'right' })

  // Line
  doc.setDrawColor(200)
  doc.line(140, finalY + 10, 195, finalY + 10)

  // Balance
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  if (balance > 0) {
    doc.setTextColor(220, 38, 38) // Red if still owing
    doc.text("Remaining Balance:", 140, finalY + 18)
    doc.text(`${balance.toLocaleString()} RWF`, 195, finalY + 18, { align: 'right' })
  } else {
    doc.setTextColor(100) // Grey if fully paid
    doc.text("Remaining Balance:", 140, finalY + 18)
    doc.text("0 RWF", 195, finalY + 18, { align: 'right' })
  }

  // --- FOOTER ---
  const pageHeight = doc.internal.pageSize.height
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text("This receipt is computer generated and valid without a signature.", 105, pageHeight - 10, { align: 'center' })

  // --- SAVE ---
  doc.save(`Receipt-${invoice.leases?.tenants?.name}-${invoice.id.slice(0,6)}.pdf`)
}