import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateReceiptPDF = (invoice: any) => {
  const doc = new jsPDF()

  // --- CONFIG ---
  const primaryColor = [30, 41, 59] as [number, number, number] 
  const accentColor = [22, 163, 74] as [number, number, number] 
  const warningColor = [234, 88, 12] as [number, number, number] 
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 14

  // --- DATA PREP ---
  const fullRentAmount = Number(invoice.amount || 0)
  const paidAmount = Number(invoice.amount_paid || 0)

  // 1. CALCULATE BALANCE
  // CRITICAL FIX: Use the 'balance' passed explicitly from the client if it exists.
  // This allows the Tenant History to pass the true cumulative balance (-100k).
  let balance = 0
  if (invoice.balance !== undefined) {
      balance = Number(invoice.balance)
  } else {
      // Fallback for standalone receipt generation
      balance = fullRentAmount - paidAmount
  }

  // 2. STATUS FLAGS
  // Overpayment = Negative Balance
  const isOverpayment = balance < 0
  const isPartial = balance > 0 && invoice.status !== 'PAID'

  // Visuals
  const activeColor = isPartial ? warningColor : accentColor
  // Overpayment also gets "CREDIT" watermark
  const watermarkText = isPartial ? "PARTIAL" : (isOverpayment ? "CREDIT" : "PAID")

  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB')

  // --- 1. HEADER SECTION ---
  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor)
  doc.text("OneLink PMS", margin, 20)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100)
  doc.text("Umuyenzi Plaza", margin, 26); doc.text("Kigali, Rwanda", margin, 30); doc.text("Phone: +250 788 000 000", margin, 34)

  doc.setFontSize(24); doc.setTextColor(...primaryColor)
  doc.text("RECEIPT", pageWidth - margin, 20, { align: 'right' })
  doc.setFillColor(240, 240, 240); doc.setDrawColor(200); doc.circle(pageWidth - margin - 15, 35, 12, 'FD')
  doc.setFontSize(8); doc.setTextColor(150); doc.text("LOGO", pageWidth - margin - 15, 36, { align: 'center' })

  // --- 2. INFO BAR ---
  const infoY = 55
  doc.setFontSize(10); doc.setTextColor(0)
  doc.setFont("helvetica", "bold"); doc.text("Receipt #:", pageWidth - 60, infoY, { align: 'right' })
  doc.setFont("helvetica", "normal"); doc.text(`REC-${invoice.id.slice(0, 6).toUpperCase()}`, pageWidth - margin, infoY, { align: 'right' })
  doc.setFont("helvetica", "bold"); doc.text("Payment Date:", pageWidth - 60, infoY + 5, { align: 'right' })
  doc.setFont("helvetica", "normal"); doc.text(paymentDate, pageWidth - margin, infoY + 5, { align: 'right' })

  // --- 3. BILL TO ---
  const billToY = 60
  doc.setFillColor(...primaryColor); doc.rect(margin, billToY, 80, 6, 'F') 
  doc.setFontSize(9); doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.text("BILL TO", margin + 2, billToY + 4)
  doc.setTextColor(0); doc.setFont("helvetica", "bold")
  doc.text(invoice.leases?.tenants?.name || "Valued Tenant", margin, billToY + 12)
  doc.setFont("helvetica", "normal"); doc.setFontSize(9)
  doc.text(`Unit ${invoice.leases?.units?.unit_number || 'N/A'}`, margin, billToY + 17)

  // --- 4. WATERMARK ---
  doc.saveGraphicsState()
  doc.setFontSize(60)
  if (isPartial) doc.setTextColor(255, 237, 213) // Orange
  else doc.setTextColor(220, 252, 231) // Green (for Paid & Credit)
  
  doc.text(watermarkText, 105, 120, { align: 'center', angle: 45 })
  doc.restoreGraphicsState()

  // --- 5. DATA TABLE ---
  const rentPeriod = new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })
  let description = `Rent Payment - ${rentPeriod}`
  if (isPartial) description = `Part Payment - ${rentPeriod} (Total Due: ${fullRentAmount.toLocaleString()})`
  else if (isOverpayment) description = `Rent + Advance Payment - ${rentPeriod}`

  autoTable(doc, {
    startY: 90,
    head: [['DESCRIPTION', 'TOTAL DUE', 'PAID NOW']],
    body: [[description, `${fullRentAmount.toLocaleString()}`, `${paidAmount.toLocaleString()}`]],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', textColor: 100 }, 2: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 }
  })

  // --- 6. TOTALS SECTION ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10
  const rightColX = pageWidth - 50
  const rightValX = pageWidth - margin

  doc.setFontSize(9); doc.setTextColor(100)
  doc.text("TOTAL INVOICE", rightColX, finalY, { align: 'right' })
  doc.setTextColor(0)
  doc.text(`${fullRentAmount.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })

  finalY += 6
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0) 
  doc.text("AMOUNT PAID", rightColX, finalY, { align: 'right' })
  doc.setTextColor(...activeColor) 
  doc.text(`${paidAmount.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })

  // --- BALANCE LOGIC ---
  if (isPartial) {
      finalY += 8
      doc.setDrawColor(200); doc.line(pageWidth - 80, finalY - 5, pageWidth - margin, finalY - 5)
      doc.setFontSize(10); doc.setTextColor(220, 38, 38) // Red
      doc.text("BALANCE DUE", rightColX, finalY, { align: 'right' })
      doc.text(`${balance.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })
  } else if (isOverpayment) {
      finalY += 8
      doc.setDrawColor(200); doc.line(pageWidth - 80, finalY - 5, pageWidth - margin, finalY - 5)
      doc.setFontSize(10); doc.setTextColor(22, 163, 74) // Green
      doc.text("CREDIT BALANCE", rightColX, finalY, { align: 'right' })
      // Use Math.abs to remove the minus sign
      doc.text(`${Math.abs(balance).toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })
  } else {
      finalY += 6
      doc.setFontSize(9); doc.setTextColor(100)
      doc.text("BALANCE", rightColX, finalY, { align: 'right' })
      doc.text("0 RWF", rightValX, finalY, { align: 'right' })
  }

  // --- 7. FOOTER ---
  // @ts-ignore
  const noteY = doc.lastAutoTable.finalY + 20
  doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold")
  doc.text("Thank you for your payment!", margin, noteY)
  
  doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100)
  if (isPartial) doc.text("Note: Partial payment. Please clear balance.", margin, noteY + 6)
  else if (isOverpayment) doc.text("Note: Overpayment recorded as credit for next month.", margin, noteY + 6)
  else doc.text("Note: Payment received in full.", margin, noteY + 6)

  doc.setDrawColor(...primaryColor); doc.setLineWidth(2)
  doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin)
  doc.save(`Receipt-${invoice.id.slice(0,6)}.pdf`)
}