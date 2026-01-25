import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateReceiptPDF = (invoice: any) => {
  const doc = new jsPDF()

  // --- CONFIG ---
  const primaryColor = [30, 41, 59] as [number, number, number] 
  const accentColor = [22, 163, 74] as [number, number, number] 
  const warningColor = [234, 88, 12] as [number, number, number] 
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height // <--- FIXED: Added this back
  const margin = 14

  // --- DATA EXTRACTION ---
  const fullRentAmount = Number(invoice.amount || 0)
  const paidAmount = Number(invoice.amount_paid || 0) // Paid THIS Transaction

  // Use the detailed accounting context we calculated in the client
  // If these are missing (e.g. old code), fallback to 0
  const openingBalance = Number(invoice.opening_balance || 0)
  const allocatedRent = Number(invoice.allocated_rent || 0)
  const allocatedWallet = Number(invoice.allocated_wallet || 0)
  const closingBalance = Number(invoice.closing_balance || 0)

  // Status Detection based on Closing Balance
  // If Closing Balance > 0.1 -> Still owe money (Partial)
  // If Closing Balance < -0.1 -> Credit
  const isPartial = closingBalance > 0.1
  const isCredit = closingBalance < -0.1

  const activeColor = isPartial ? warningColor : accentColor
  const watermarkText = isPartial ? "PARTIAL" : (isCredit ? "CREDIT" : "PAID")

  // Date Formatting
  const rawDate = invoice.due_date || invoice.payment_date || new Date().toISOString()
  const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return new Date().toLocaleDateString('en-GB')
      return date.toLocaleDateString('en-GB')
  }
  const paymentDateFormatted = formatDate(invoice.payment_date || new Date().toISOString())

  // --- HEADER ---
  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor)
  doc.text("OneLink PMS", margin, 20)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100)
  doc.text("Umuyenzi Plaza", margin, 26); doc.text("Kigali, Rwanda", margin, 30); doc.text("Phone: +250 788 000 000", margin, 34)

  doc.setFontSize(24); doc.setTextColor(...primaryColor)
  doc.text("RECEIPT", pageWidth - margin, 20, { align: 'right' })

  // --- INFO BAR ---
  const infoY = 55
  doc.setFontSize(10); doc.setTextColor(0)
  doc.setFont("helvetica", "bold"); doc.text("Receipt #:", pageWidth - 60, infoY, { align: 'right' })
  doc.setFont("helvetica", "normal"); doc.text(`REC-${invoice.id.slice(0, 6).toUpperCase()}`, pageWidth - margin, infoY, { align: 'right' })
  doc.setFont("helvetica", "bold"); doc.text("Payment Date:", pageWidth - 60, infoY + 5, { align: 'right' })
  doc.setFont("helvetica", "normal"); doc.text(paymentDateFormatted, pageWidth - margin, infoY + 5, { align: 'right' })

  // --- BILL TO ---
  const billToY = 60
  doc.setFillColor(...primaryColor); doc.rect(margin, billToY, 80, 6, 'F') 
  doc.setFontSize(9); doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.text("BILL TO", margin + 2, billToY + 4)
  doc.setTextColor(0); doc.setFont("helvetica", "bold")
  doc.text(invoice.leases?.tenants?.name || "Valued Tenant", margin, billToY + 12)
  doc.setFont("helvetica", "normal"); doc.setFontSize(9)
  doc.text(`Unit ${invoice.leases?.units?.unit_number || 'N/A'}`, margin, billToY + 17)

  // --- WATERMARK ---
  doc.saveGraphicsState()
  doc.setFontSize(60)
  if (isPartial) doc.setTextColor(255, 237, 213) 
  else doc.setTextColor(220, 252, 231) 
  doc.text(watermarkText, 105, 120, { align: 'center', angle: 45 })
  doc.restoreGraphicsState()

  // --- DATA TABLE (SMART DESCRIPTION) ---
  const rentDateObj = new Date(rawDate)
  const rentPeriod = !isNaN(rentDateObj.getTime()) 
    ? rentDateObj.toLocaleString('default', { month: 'long', year: 'numeric' }) 
    : 'Current Period'

  // SMART DESCRIPTION
  let description = `Rent Payment - ${rentPeriod}`
  if (allocatedWallet > 0 && allocatedRent > 0) {
      description = `Rent Settlement + Credit Deposit`
  } else if (allocatedWallet > 0 && allocatedRent === 0) {
      description = `Wallet Credit Deposit`
  } else if (isPartial) {
      description = `Partial Rent Payment`
  }

  autoTable(doc, {
    startY: 90,
    head: [['DESCRIPTION', 'TOTAL INVOICE', 'PAID NOW']],
    body: [[description, `${fullRentAmount.toLocaleString()}`, `${paidAmount.toLocaleString()}`]],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', textColor: 100 }, 2: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 }
  })

  // --- TOTALS ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10
  const rightColX = pageWidth - 50
  const rightValX = pageWidth - margin

  // 1. Previous Balance (Context)
  doc.setFontSize(9); doc.setTextColor(100)
  doc.text("Previous Balance:", rightColX, finalY, { align: 'right' })
  doc.text(`${openingBalance.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })

  // 2. Amount Paid (Action)
  finalY += 6
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0) 
  doc.text("AMOUNT PAID:", rightColX, finalY, { align: 'right' })
  doc.setTextColor(...activeColor) 
  doc.text(`${paidAmount.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })

  // 3. Closing Balance (Result)
  finalY += 8
  doc.setDrawColor(200); doc.line(pageWidth - 80, finalY - 5, pageWidth - margin, finalY - 5)
  
  if (isPartial) {
      doc.setFontSize(10); doc.setTextColor(220, 38, 38) // Red
      doc.text("REMAINING DUE:", rightColX, finalY, { align: 'right' })
      doc.text(`${closingBalance.toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })
  } else if (isCredit) {
      doc.setFontSize(10); doc.setTextColor(22, 163, 74) // Green
      doc.text("CREDIT BALANCE:", rightColX, finalY, { align: 'right' })
      doc.text(`${Math.abs(closingBalance).toLocaleString()} RWF`, rightValX, finalY, { align: 'right' })
  } else {
      doc.setFontSize(9); doc.setTextColor(100) // Grey
      doc.text("BALANCE:", rightColX, finalY, { align: 'right' })
      doc.text("0 RWF", rightValX, finalY, { align: 'right' })
  }

  // --- FOOTER NOTE (THE EXPLANATION) ---
  // @ts-ignore
  const noteY = doc.lastAutoTable.finalY + 30
  doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold")
  doc.text("Payment Breakdown:", margin, noteY)
  
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(80)
  
  // Construct the narrative
  let narrative = ""
  
  if (allocatedRent > 0) {
      narrative += `• ${allocatedRent.toLocaleString()} RWF was applied to clear rent debt.\n`
  }
  if (allocatedWallet > 0) {
      narrative += `• ${allocatedWallet.toLocaleString()} RWF was added to your wallet credit.\n`
  }
  
  if (isPartial) {
      narrative += `• You still owe ${closingBalance.toLocaleString()} RWF. Please clear this balance soon.`
  } else if (isCredit) {
      narrative += `• You have a total credit of ${Math.abs(closingBalance).toLocaleString()} RWF for future invoices.`
  } else {
      narrative += `• Your account for this period is fully settled.`
  }

  doc.text(narrative, margin, noteY + 6)

  // Footer Line
  doc.setDrawColor(...primaryColor); doc.setLineWidth(2)
  doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin)
  
  doc.save(`Receipt-${invoice.id.slice(0,6)}.pdf`)
}