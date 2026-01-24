import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF()

  // --- BRANDING & HEADER ---
  doc.setFontSize(20)
  doc.text("UMUYENZI PLAZA", 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("KN 5 Rd, Remera, Kigali", 14, 28)
  doc.text("Phone: +250 788 000 000", 14, 33)
  doc.text("Email: accounts@umuyenzi.com", 14, 38)

  // --- INVOICE DETAILS (Right Side) ---
  doc.setFontSize(24)
  doc.setTextColor(200) // Light Grey
  doc.text("INVOICE", 140, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(0) // Black
  doc.text(`Invoice #: INV-${invoice.id.slice(0, 6).toUpperCase()}`, 140, 30)
  
  const createdDate = new Date(invoice.created_at).toLocaleDateString('en-GB')
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-GB')
  doc.text(`Issue Date: ${createdDate}`, 140, 35)

  // --- BILL TO ---
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Bill To:", 14, 55)
  
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(invoice.leases?.tenants?.name || "Unknown Tenant", 14, 62)
  
  doc.setFontSize(10)
  doc.text(`Unit: ${invoice.leases?.units?.unit_number}`, 14, 67)
  doc.text(invoice.leases?.tenants?.phone || "", 14, 72)

  // --- DUE DATE BOX (Right Side) ---
  doc.setDrawColor(200)
  doc.setFillColor(255, 240, 240) // Light Red Background
  doc.rect(140, 50, 50, 20, 'FD') // FD = Fill & Draw
  
  doc.setFontSize(8)
  doc.setTextColor(200, 0, 0) // Red
  doc.text("DUE DATE", 145, 56)
  
  doc.setFontSize(14)
  doc.text(dueDate, 145, 65)

  // --- TABLE ---
  const rentPeriod = new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })
  
  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Period', 'Amount']],
    body: [
      [
        `Monthly Rent - Unit ${invoice.leases?.units?.unit_number}`, 
        rentPeriod, 
        `${Number(invoice.amount).toLocaleString()} RWF`
      ],
      // Add other items here if needed later
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 }, // Dark Slate Blue
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // --- TOTALS ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10
  
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text("Total Due:", 140, finalY)
  
  doc.setFontSize(14)
  doc.text(`${Number(invoice.amount).toLocaleString()} RWF`, 195, finalY, { align: 'right' })

  // --- PAYMENT INSTRUCTIONS ---
  const payY = finalY + 20
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.rect(14, payY, 180, 40, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text("PAYMENT METHODS", 14, payY - 3) // Label above box

  // Bank
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text("Bank Transfer", 20, payY + 10)
  doc.setTextColor(0)
  doc.text("Bank of Kigali (BK)", 20, payY + 16)
  doc.setFont("courier")
  doc.text("00048-000000-00", 20, payY + 22)
  doc.setFont("helvetica")

  // MoMo
  doc.setTextColor(100)
  doc.text("Mobile Money", 110, payY + 10)
  doc.setTextColor(0)
  doc.text("MoMoPay Code", 110, payY + 16)
  doc.setFont("courier")
  doc.text("*182*8*1*000000#", 110, payY + 22)
  doc.setFont("helvetica")

  // --- FOOTER ---
  doc.setFontSize(8)
  doc.setTextColor(150)
  const pageHeight = doc.internal.pageSize.height
  doc.text("Thank you for your business. Please include Invoice # in remarks.", 105, pageHeight - 10, { align: 'center' })

  // --- SAVE ---
  doc.save(`Invoice-${invoice.leases?.tenants?.name}-${invoice.id.slice(0,6)}.pdf`)
}