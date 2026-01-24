import React from 'react';

// Define Props
interface InvoiceProps {
  invoice: any; // The invoice object from your DB
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>((props, ref) => {
  const { invoice } = props;
  const tenant = invoice.leases?.tenants;
  const unit = invoice.leases?.units;
  const property = unit?.properties;

  // Safety checks in case data is missing
  if (!tenant || !unit) return null;

  return (
    <div ref={ref} className="bg-white text-black font-sans p-12 max-w-[210mm] min-h-[297mm] mx-auto border border-gray-200 relative">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
        <div className="w-1/2">
          {/* LOGO AREA */}
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-gray-900">
            {property?.name || "UMUYENZI PLAZA"}
          </h1>
          <div className="mt-3 text-sm text-gray-600 space-y-1">
            <p>KN 5 Rd, Remera, Kigali</p>
            <p>TIN: 123-456-789</p> 
            <p>Phone: +250 788 000 000</p>
            <p>Email: management@umuyenzi.com</p>
          </div>
        </div>

        <div className="text-right w-1/2">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">INVOICE</h2>
          <div className="mt-4 space-y-1">
            <p className="text-sm font-bold text-gray-500 uppercase">Invoice Number</p>
            <p className="text-xl font-mono">#INV-{invoice.id.slice(0,6).toUpperCase()}</p>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-bold text-gray-500 uppercase">Issue Date</p>
            <p className="text-lg font-mono">{new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      {/* --- BILL TO & DUE DATE --- */}
      <div className="flex justify-between mb-10">
        <div className="w-1/2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To Tenant</p>
          <div className="pl-4 border-l-2 border-gray-300">
            <p className="text-xl font-bold text-gray-900">{tenant.name}</p>
            <p className="text-lg text-gray-700">Unit: {unit.unit_number}</p>
            <p className="text-sm text-gray-600 mt-1">{tenant.phone}</p>
            <p className="text-sm text-gray-600">{tenant.email}</p>
          </div>
        </div>

        <div className="w-1/3 text-right">
          <div className="bg-red-50 p-4 rounded border border-red-100">
            <p className="text-xs font-bold text-red-500 uppercase mb-1">Payment Due By</p>
            <p className="text-xl font-bold text-red-700">
              {new Date(invoice.due_date).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* --- LINE ITEMS --- */}
      <div className="mb-10">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left py-3 px-4 font-semibold text-sm uppercase">Description</th>
              <th className="text-center py-3 px-4 font-semibold text-sm uppercase">Month</th>
              <th className="text-right py-3 px-4 font-semibold text-sm uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-medium">
                Commercial Rent
                <span className="block text-xs text-gray-500 font-normal mt-1">Base Rent Agreement</span>
              </td>
              <td className="py-4 px-4 text-center text-sm text-gray-600">
                {new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </td>
              <td className="py-4 px-4 text-right font-mono text-gray-900">
                {Number(invoice.amount).toLocaleString()} RWF
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- TOTALS --- */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2">
          <div className="flex justify-between text-lg font-bold border-t-2 border-black pt-4">
            <span>TOTAL DUE:</span>
            <span>{Number(invoice.amount).toLocaleString()} RWF</span>
          </div>
        </div>
      </div>

      {/* --- PAYMENT INSTRUCTIONS --- */}
      <div className="bg-gray-100 p-6 rounded-sm mb-8">
        <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 border-b border-gray-300 pb-2">
          How to Pay
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bank Transfer</p>
            <p className="font-semibold">Bank of Kigali (BK)</p>
            <p className="font-mono text-lg">00048-000000-00</p>
            <p className="text-sm text-gray-600 mt-1">Acct Name: Umuyenzi City Center Ltd</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Mobile Money</p>
            <p className="font-semibold">MTN MoMo Pay</p>
            <p className="font-mono text-lg">*182*8*1*XXXXXX#</p>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="text-center pt-8 text-xs text-gray-500 mt-auto">
        <p className="font-bold mb-1">TERMS & CONDITIONS</p>
        <p>
          Payment is required by the due date. A late fee of 5% may apply to overdue balances.
          Please reference Invoice #{invoice.id.slice(0,6)} in your payment description.
        </p>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';