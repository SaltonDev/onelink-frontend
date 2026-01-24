import React from 'react';

interface ReceiptProps {
  invoice: any;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptProps>(({ invoice }, ref) => {
  const tenant = invoice.leases?.tenants;
  const unit = invoice.leases?.units;
  const property = unit?.properties;
  
  // Calculate specific amounts
  const amountPaid = Number(invoice.amount_paid) || 0;
  const totalAmount = Number(invoice.amount) || 0;
  const balance = totalAmount - amountPaid;
  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  return (
    <div ref={ref} className="bg-white text-black font-sans p-12 max-w-[210mm] mx-auto border border-gray-200 min-h-[297mm] relative">
      
      {/* WATERMARK */}
      <div className="absolute top-1/3 left-1/4 transform -rotate-45 border-8 border-green-500 text-green-500 text-8xl font-black p-4 opacity-10 select-none pointer-events-none z-0">
        PAID
      </div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8 relative z-10">
        <div className="w-1/2">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">
            {property?.name || "UMUYENZI PLAZA"}
          </h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p>Nyabugogo, Kigali</p>
            <p>Phone: +250 788 000 000</p>
          </div>
        </div>

        <div className="text-right w-1/2">
          <h2 className="text-4xl font-bold text-gray-900">RECEIPT</h2>
          <div className="mt-2 space-y-1">
            <p className="text-gray-500 text-sm">Receipt No:</p>
            <p className="text-lg font-mono font-semibold">#REC-{invoice.id.slice(0,6).toUpperCase()}</p>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-gray-500 text-sm">Date Paid:</p>
            <p className="text-lg font-mono">{paymentDate}</p>
          </div>
        </div>
      </div>

      {/* --- TENANT INFO --- */}
      <div className="flex justify-between mb-10 gap-8 relative z-10">
        <div className="w-1/2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Received From</p>
          <div className="bg-gray-50 p-4 border-l-4 border-gray-900">
            <p className="text-xl font-bold text-gray-900">{tenant?.name}</p>
            <p className="text-sm text-gray-600 mt-1">Unit: {unit?.unit_number}</p>
            <p className="text-sm text-gray-600">{tenant?.phone}</p>
          </div>
        </div>

        <div className="w-1/2 text-right">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Details</p>
          <div className="bg-gray-50 p-4 border-r-4 border-gray-900 h-full">
            <p className="text-lg font-medium">Method: {invoice.payments?.[0]?.method || 'MoMo / Cash'}</p>
            <p className="text-xs text-gray-400 mt-2 italic">
              System Ref: {invoice.whatsapp_message_id || invoice.id}
            </p>
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="mb-8 relative z-10">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="text-left py-3 px-4 font-bold text-xs text-gray-600 uppercase">Description</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-gray-600 uppercase">Period</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-gray-600 uppercase">Total Due</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 text-gray-800">
                Rent & Service Fee
                <span className="block text-xs text-gray-500 mt-1">Unit {unit?.unit_number}</span>
              </td>
              <td className="py-4 px-4 text-right text-gray-600 text-sm">
                {new Date(invoice.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </td>
              <td className="py-4 px-4 text-right font-mono font-medium text-gray-900">
                {totalAmount.toLocaleString()} RWF
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- TOTALS --- */}
      <div className="flex justify-end mb-16 relative z-10">
        <div className="w-1/2 bg-gray-50 p-6">
          <div className="flex justify-between mb-4 text-lg text-gray-800 font-bold border-b border-gray-300 pb-4">
            <span>Amount Paid:</span>
            <span>{amountPaid.toLocaleString()} RWF</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500 uppercase">Remaining Balance:</span>
            <span className={`text-xl font-bold font-mono ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance.toLocaleString()} RWF
            </span>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="text-center pt-8 border-t border-gray-200 relative z-10 mt-auto">
        <p className="text-sm font-bold text-gray-900 mb-1">Thank you for your payment.</p>
        <p className="text-xs text-gray-500">
          This receipt was generated electronically and acts as official proof of payment.
        </p>
      </div>

    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';