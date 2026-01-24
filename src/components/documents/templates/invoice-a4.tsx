import React from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

// 1. DEFINE SAFE HEX COLORS (html2canvas compatible)
const colors = {
  white: '#ffffff',
  black: '#000000',
  slate900: '#0f172a', // Dark text
  slate700: '#334155', // Medium text
  slate500: '#64748b', // Muted text
  slate400: '#94a3b8', // Light text
  slate200: '#e2e8f0', // Borders
  slate50:  '#f8fafc', // Light backgrounds
  red50:    '#fef2f2', // Alert bg
  red100:   '#fee2e2', // Alert border
  red500:   '#ef4444', // Alert text
  red700:   '#b91c1c', // Alert strong text
}

interface InvoiceA4Props {
  invoice: any;
  branding?: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    tin?: string;
    bankName?: string;
    bankAccount?: string;
    momoCode?: string;
  }
}

export const InvoiceA4 = React.forwardRef<HTMLDivElement, InvoiceA4Props>(
  ({ invoice, branding }, ref) => {
    
    const company = branding || {
      companyName: "UMUYENZI PLAZA",
      address: "KN 5 Rd, Remera, Kigali",
      phone: "+250 788 000 000",
      email: "accounts@umuyenzi.com",
      tin: "123-456-789",
      bankName: "Bank of Kigali (BK)",
      bankAccount: "00048-000000-00",
      momoCode: "*182*8*1*000000#"
    }

    const tenant = invoice.leases?.tenants
    const unit = invoice.leases?.units
    const issueDate = new Date(invoice.created_at).toLocaleDateString('en-GB')
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-GB')
    
    return (
      <div 
        ref={ref} 
        style={{ backgroundColor: colors.white, color: colors.slate900 }}
        className="font-sans p-[10mm] w-[210mm] min-h-[297mm] mx-auto relative leading-normal"
      >
        
        {/* --- HEADER --- */}
        <div style={{ borderColor: colors.slate900 }} className="flex justify-between items-start border-b-2 pb-6 mb-8">
          <div className="w-1/2">
            <h1 style={{ color: colors.slate900 }} className="text-2xl font-bold uppercase tracking-wide mb-2">
              {company.companyName}
            </h1>
            <div style={{ color: colors.slate500 }} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" /> {company.address}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" /> {company.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> {company.email}
              </div>
              {company.tin && <p className="font-mono mt-1">TIN: {company.tin}</p>}
            </div>
          </div>

          <div className="text-right w-1/2">
            <h2 style={{ color: colors.slate400 }} className="text-4xl font-light uppercase tracking-tighter">Invoice</h2>
            <div className="mt-4">
              <p style={{ color: colors.slate500 }} className="text-xs font-bold uppercase">Invoice #</p>
              <p className="text-lg font-mono font-semibold">INV-{invoice.id.slice(0, 6).toUpperCase()}</p>
            </div>
            <div className="mt-2">
              <p style={{ color: colors.slate500 }} className="text-xs font-bold uppercase">Issue Date</p>
              <p className="text-md font-mono">{issueDate}</p>
            </div>
          </div>
        </div>

        {/* --- BILL TO --- */}
        <div className="flex justify-between mb-12">
          <div className="w-1/2">
            <p style={{ color: colors.slate400 }} className="text-xs font-bold uppercase tracking-widest mb-2">Bill To</p>
            <div style={{ borderColor: colors.slate200 }} className="border-l-4 pl-4">
              <p style={{ color: colors.slate900 }} className="text-lg font-bold">{tenant?.name}</p>
              <p style={{ color: colors.slate700 }} >Unit: {unit?.unit_number}</p>
              <p style={{ color: colors.slate500 }} className="text-sm mt-1">{tenant?.phone}</p>
            </div>
          </div>

          <div className="w-1/3 text-right">
             <div style={{ backgroundColor: colors.red50, borderColor: colors.red100 }} className="border p-4 rounded-sm">
                <p style={{ color: colors.red500 }} className="text-xs font-bold uppercase mb-1">Due Date</p>
                <p style={{ color: colors.red700 }} className="text-xl font-bold font-mono">{dueDate}</p>
             </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderColor: colors.slate900, color: colors.slate900 }} className="border-b-2 text-xs font-bold uppercase">
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 px-4 text-center">Period</th>
                <th className="py-3 pl-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr style={{ borderColor: colors.slate200 }} className="border-b">
                <td className="py-4 pr-4">
                  <p style={{ color: colors.slate900 }} className="font-semibold">Monthly Rent</p>
                  <p style={{ color: colors.slate500 }} className="text-xs">Commercial lease agreement - Unit {unit?.unit_number}</p>
                </td>
                <td style={{ color: colors.slate500 }} className="py-4 px-4 text-center">
                  {new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </td>
                <td className="py-4 pl-4 text-right font-mono font-medium">
                  {Number(invoice.amount).toLocaleString()} RWF
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- TOTALS --- */}
        <div className="flex justify-end mb-16">
          <div style={{ borderColor: colors.slate900 }} className="w-1/2 border-t-2 pt-4">
            <div className="flex justify-between items-center">
              <span style={{ color: colors.slate900 }} className="text-lg font-bold">Total Due</span>
              <span style={{ color: colors.slate900 }} className="text-2xl font-bold font-mono">
                {Number(invoice.amount).toLocaleString()} RWF
              </span>
            </div>
          </div>
        </div>

        {/* --- PAYMENT INSTRUCTIONS --- */}
        <div style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }} className="p-8 rounded-sm mb-8 border">
          <h3 style={{ color: colors.slate900, borderColor: colors.slate200 }} className="text-sm font-bold uppercase mb-6 border-b pb-2">
            Payment Methods
          </h3>
          <div className="grid grid-cols-2 gap-8 text-sm">
            {/* BANK */}
            <div>
              <p style={{ color: colors.slate500 }} className="text-xs font-bold uppercase mb-1">Bank Transfer</p>
              <p style={{ color: colors.slate900 }} className="font-semibold">{company.bankName}</p>
              <p style={{ color: colors.slate700 }} className="font-mono">{company.bankAccount}</p>
            </div>
            {/* MOMO */}
            <div>
              <p style={{ color: colors.slate500 }} className="text-xs font-bold uppercase mb-1">Mobile Money</p>
              <p style={{ color: colors.slate900 }} className="font-semibold">Code / MoMoPay</p>
              <p style={{ color: colors.slate700 }} className="font-mono">{company.momoCode}</p>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div style={{ borderColor: colors.slate50 }} className="absolute bottom-12 left-10 right-10 text-center text-xs border-t pt-4">
          <p style={{ color: colors.slate500 }} className="mb-1 font-semibold">Terms & Conditions</p>
          <p style={{ color: colors.slate400 }}>Please include Invoice #{invoice.id.slice(0, 6)} in your payment reference. Late payments may incur penalties.</p>
        </div>
      </div>
    )
  }
)
InvoiceA4.displayName = 'InvoiceA4'