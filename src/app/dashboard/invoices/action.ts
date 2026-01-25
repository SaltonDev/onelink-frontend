'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

function formatToRwandaNumber(rawPhone: string) {
  if (!rawPhone) return ""
  let phone = rawPhone.replace(/\D/g, '')
  if (phone.startsWith('07')) phone = '250' + phone.substring(1)
  else if (phone.startsWith('7')) phone = '250' + phone
  if (!phone.startsWith('250') && phone.length === 9) phone = '250' + phone
  return phone 
}

async function sendToWaSender(payload: { to: string, text: string }) {
  const API_URL = process.env.WASENDER_API_URL
  const API_KEY = process.env.WASENDER_API_KEY
  if (!API_URL) return { success: false, error: "Missing API Configuration" }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': API_KEY ? `Bearer ${API_KEY}` : '' 
      },
      body: JSON.stringify(payload)
    })
    return await response.json()
  } catch (e) {
    return { success: false, error: "Network Error" }
  }
}

// ==========================================
// 2. GENERATE INVOICES (FIXED: NOON TIMEZONE)
// ==========================================
export async function generateMonthlyInvoices() {
  const supabase = await createClient()

  try {
    // 1. Get Active Leases
    const { data: leases } = await (supabase.from('leases') as any)
      .select('id, tenant_id, rent_amount, start_date')
      .eq('status', 'ACTIVE')

    if (!leases || leases.length === 0) {
      return { success: false, message: "No active leases found." }
    }

    // 2. DUPLICATE CHECKER
    const lookBackDate = new Date()
    lookBackDate.setDate(lookBackDate.getDate() - 60) // Look back 60 days
    
    const { data: recentInvoices } = await (supabase.from('invoices') as any)
      .select('lease_id, due_date')
      .gte('created_at', lookBackDate.toISOString())

    const existingBills = new Set(
      recentInvoices?.map((inv: any) => {
        // Compare YYYY-MM
        const d = new Date(inv.due_date)
        return `${inv.lease_id}_${d.getFullYear()}-${d.getMonth()}` 
      })
    )

    const invoicesToCreate: any[] = []
    const today = new Date()
    today.setHours(0,0,0,0) 
    
    // 3. ITERATE LEASES
    for (const lease of leases) {
      if (!lease.start_date) continue

      const startDate = new Date(lease.start_date)
      const anchorDay = startDate.getDate()

      // --- LOGIC A: CHECK CURRENT MONTH ---
      // Force Noon (12, 0, 0) to avoid timezone rollback
      let currentMonthDue = new Date(today.getFullYear(), today.getMonth(), anchorDay, 12, 0, 0)
      
      // Handle end of month edge cases
      if (currentMonthDue.getMonth() !== today.getMonth()) {
         currentMonthDue = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0)
      }

      const currentKey = `${lease.id}_${currentMonthDue.getFullYear()}-${currentMonthDue.getMonth()}`
      
      // If missing THIS month, generate immediately
      if (!existingBills.has(currentKey)) {
        invoicesToCreate.push({
          lease_id: lease.id,
          amount: lease.rent_amount,
          due_date: currentMonthDue.toISOString(),
          // If strictly past today (midnight), it is OVERDUE
          status: currentMonthDue < today ? 'OVERDUE' : 'DRAFT', 
          amount_paid: 0
        })
        continue 
      }

      // --- LOGIC B: CHECK NEXT MONTH ---
      let nextMonthDue = new Date(today.getFullYear(), today.getMonth() + 1, anchorDay, 12, 0, 0)
      
      if (nextMonthDue.getMonth() !== (today.getMonth() + 1) % 12) {
         nextMonthDue = new Date(today.getFullYear(), today.getMonth() + 2, 0, 12, 0, 0)
      }

      const nextKey = `${lease.id}_${nextMonthDue.getFullYear()}-${nextMonthDue.getMonth()}`
      
      const diffTime = nextMonthDue.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 7 && !existingBills.has(nextKey)) {
         invoicesToCreate.push({
            lease_id: lease.id,
            amount: lease.rent_amount,
            due_date: nextMonthDue.toISOString(),
            status: 'DRAFT',
            amount_paid: 0
         })
      }
    }

    // 4. INSERT
    if (invoicesToCreate.length === 0) {
      return { success: true, message: "All invoices are up to date." }
    }

    const { error } = await (supabase.from('invoices') as any).insert(invoicesToCreate)
    if (error) throw error

    revalidatePath('/dashboard/invoices')
    return { success: true, message: `Generated ${invoicesToCreate.length} new invoices.` }

  } catch (error) {
    console.error("Generation Error:", error)
    return { success: false, message: "Failed to process request." }
  }
}

// ==========================================
// 3. SEND WHATSAPP
// ==========================================
export async function approveAndSendInvoices(invoiceIds: string[]) {
  const supabase = await createClient()
  if (!invoiceIds.length) return

  await (supabase.from('invoices') as any).update({ status: 'PENDING' }).in('id', invoiceIds)

  const { data: invoices } = await (supabase.from('invoices') as any)
    .select('*, leases(tenants(name, phone), units(unit_number))')
    .in('id', invoiceIds)

  if (!invoices) return

  const messages = invoices.map((inv: any) => {
    // @ts-ignore
    const phone = formatToRwandaNumber(inv.leases?.tenants?.phone)
    // @ts-ignore
    const name = inv.leases?.tenants?.name
    // @ts-ignore
    const unit = inv.leases?.units?.unit_number
    // @ts-ignore
    const amount = Number(inv.amount).toLocaleString()
    
    if (!phone || phone.length < 10) return null

    return {
      // @ts-ignore
      id: inv.id,
      name,
      to: phone,
      text: `*INVOICE*\nHello ${name},\nRent for Unit ${unit}.\n💰 Amount: ${amount} RWF\nPay via MoMo. Thanks!`
    }
  }).filter(Boolean)

  await Promise.allSettled(
    messages.map(async (msg: any) => {
      const res = await sendToWaSender({ to: msg.to, text: msg.text })
      const success = res?.data?.success || res?.status === 'success'
      const msgId = res?.data?.key?.id || res?.messageId

      if (success) {
        await (supabase.from('invoices') as any)
          .update({ 
            whatsapp_sent: true, 
            whatsapp_message_id: msgId, 
            delivery_status: 'SENT' 
          })
          .eq('id', msg.id)
      } else {
        await (supabase.from('invoices') as any)
          .update({ delivery_status: 'FAILED' })
          .eq('id', msg.id)
      }
    })
  )

  revalidatePath('/dashboard/invoices')
}

// ==========================================
// 4. RECORD PAYMENT (FIXED ERROR HANDLING)
// ==========================================
export async function recordPayment(formData: FormData) {
  const supabase = await createClient()
  
  const invoiceId = formData.get('invoice_id') as string
  const amountInput = Number(formData.get('amount')) 
  const method = formData.get('method') as string || 'MOMO'
  const notes = formData.get('notes') as string || ''
  const useWallet = formData.get('use_wallet') === 'on' 
  
  const paymentDateInput = formData.get('payment_date') as string
  const finalPaymentDate = paymentDateInput 
    ? new Date(paymentDateInput).toISOString() 
    : new Date().toISOString()

  // --- 1. STRICT ID CHECK ---
  if (!invoiceId) {
      console.error("❌ Payment Error: No Invoice ID received")
      throw new Error("System Error: Invoice ID is missing.")
  }

  const { data: invoice } = await (supabase.from('invoices') as any)
    .select(`*, leases (id, credit_balance, tenants (name, phone), units (unit_number))`)
    .eq('id', invoiceId)
    .single()

  if (!invoice) throw new Error("Invoice not found in database")
  
  // @ts-ignore
  const leaseId = invoice.lease_id || invoice.leases?.id
  
  // @ts-ignore
  const amountDue = Number(invoice.amount) - (Number(invoice.amount_paid) || 0)
  // @ts-ignore
  const currentWallet = Number(invoice.leases?.credit_balance) || 0
  
  let walletContribution = 0
  let cashContribution = amountInput
  
  if (useWallet && currentWallet > 0) {
    walletContribution = Math.min(amountDue, currentWallet)
  }

  const totalPayment = walletContribution + cashContribution
  
  let newStatus = 'PARTIAL'
  let creditToWallet = 0 
  let paymentForInvoice = 0

  if (totalPayment >= amountDue) {
    newStatus = 'PAID'
    paymentForInvoice = amountDue
    creditToWallet = totalPayment - amountDue 
  } else {
    newStatus = 'PARTIAL'
    paymentForInvoice = totalPayment
  }

  // A. Wallet Payment
  if (walletContribution > 0) {
    await (supabase.from('payments') as any).insert({
      invoice_id: invoiceId,
      lease_id: leaseId, 
      amount: walletContribution,
      method: 'WALLET',
      notes: 'Applied from credit balance',
      payment_date: finalPaymentDate
    })
    await (supabase.from('leases') as any).update({
      credit_balance: currentWallet - walletContribution
    }).eq('id', leaseId)
  }

  // B. Cash Payment
  if (cashContribution > 0) {
    await (supabase.from('payments') as any).insert({
      invoice_id: invoiceId,
      lease_id: leaseId, 
      amount: cashContribution,
      method,
      notes,
      payment_date: finalPaymentDate
    })
  }

  // C. Update Invoice
  const { error: updateError } = await (supabase.from('invoices') as any)
    .update({
      status: newStatus,
      // @ts-ignore
      amount_paid: (Number(invoice.amount_paid) || 0) + paymentForInvoice,
      payment_date: finalPaymentDate
    })
    .eq('id', invoiceId)

  if (updateError) throw new Error("Failed to update invoice status")

  // D. Update Credit
  if (creditToWallet > 0) {
    const { data: freshLease } = await (supabase.from('leases') as any).select('credit_balance').eq('id', leaseId).single()
    const freshCredit = Number(freshLease?.credit_balance) || 0
    await (supabase.from('leases') as any).update({ credit_balance: freshCredit + creditToWallet }).eq('id', leaseId)
  }

  // E. Send Receipt
  try {
    // @ts-ignore
    const phone = formatToRwandaNumber(invoice.leases?.tenants?.phone)
    // @ts-ignore
    const name = invoice.leases?.tenants?.name
    // @ts-ignore
    const unit = invoice.leases?.units?.unit_number
    
    if (phone && phone.length >= 10) {
      const receiptAmount = totalPayment.toLocaleString()
      const date = new Date(finalPaymentDate).toLocaleDateString('en-GB') 
      const receiptText = `🧾 *PAYMENT RECEIPT*\nHello ${name},\nPayment received for Unit ${unit}.\n\n💵 *Amount:* ${receiptAmount} RWF\n📅 *Date:* ${date}\n✅ *Status:* ${newStatus}\n${creditToWallet > 0 ? `💰 *Wallet Credit:* ${creditToWallet.toLocaleString()} RWF added.` : ''}\n\nThank you!`
      await sendToWaSender({ to: phone, text: receiptText })
    }
  } catch (receiptError) {
    console.error("⚠️ Failed to send receipt:", receiptError)
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/tenants')
  
  return { success: true, message: 'Payment recorded successfully.' }
}