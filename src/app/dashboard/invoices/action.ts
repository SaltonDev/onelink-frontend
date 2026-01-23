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
// 2. GENERATE INVOICES
// ==========================================
export async function generateMonthlyInvoices() {
  const supabase = await createClient()

  try {
    // 1. Get Active Leases with their START DATE
    const { data: leases } = await (supabase.from('leases') as any)
      .select('id, tenant_id, rent_amount, start_date')
      .eq('status', 'ACTIVE')

    if (!leases || leases.length === 0) {
      return { success: false, message: "No active leases found." }
    }

    // 2. PREPARE DUPLICATE CHECKER
    // Get invoices from the last 45 days to verify we haven't already billed this period
    const lookBackDate = new Date()
    lookBackDate.setDate(lookBackDate.getDate() - 45)
    
    const { data: recentInvoices } = await (supabase.from('invoices') as any)
      .select('lease_id, due_date')
      .gte('created_at', lookBackDate.toISOString())

    // Create a Set of "LeaseID + DueDate" to detect duplicates easily
    // Format: "lease_123_2026-01-20"
    const existingBills = new Set(
      recentInvoices?.map((inv: any) => {
        const d = new Date(inv.due_date)
        return `${inv.lease_id}_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )

    const invoicesToCreate: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to compare dates purely

    // 3. ITERATE EVERY LEASE
    for (const lease of leases) {
      if (!lease.start_date) continue

      // A. FIND THE "ANCHOR DAY" (e.g., 20th)
      const startDate = new Date(lease.start_date)
      let anchorDay = startDate.getDate()

      // B. CALCULATE TARGET DUE DATE
      // We start with the Current Month's version of that day
      let targetDueDate = new Date(today.getFullYear(), today.getMonth(), anchorDay)
      
      // Handle End-of-Month Edge Cases (e.g. lease started 31st, but it's Feb)
      // If setting to 31st rolled over to next month, fix it to last day of current month
      if (targetDueDate.getMonth() !== today.getMonth()) {
        targetDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      }

      // If this date is already PAST (e.g. today is 21st, target was 20th), 
      // then the *next* due date is actually next month.
      if (targetDueDate < today) {
        targetDueDate = new Date(today.getFullYear(), today.getMonth() + 1, anchorDay)
         // Handle End-of-Month again for next month
         const nextMonth = today.getMonth() + 1
         if (targetDueDate.getMonth() !== (nextMonth % 12)) {
            targetDueDate = new Date(today.getFullYear(), nextMonth + 1, 0)
         }
      }

      // C. THE "7-DAY WINDOW" CHECK
      // Calculate difference in days
      const diffTime = targetDueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Only generate if it's due within the next 7 days (e.g. 0 to 7 days away)
      if (diffDays >= 0 && diffDays <= 7) {
        
        // D. DUPLICATE CHECK
        // Have we already billed this specific date?
        const billKey = `${lease.id}_${targetDueDate.getFullYear()}-${targetDueDate.getMonth()}-${targetDueDate.getDate()}`
        
        if (!existingBills.has(billKey)) {
          console.log(`✅ Generatng for Lease ${lease.id}: Due on ${targetDueDate.toDateString()} (in ${diffDays} days)`)
          
          invoicesToCreate.push({
            lease_id: lease.id,
            amount: lease.rent_amount,
            due_date: targetDueDate.toISOString(), // THIS FIXES YOUR DISPLAY ISSUE
            status: 'DRAFT',
            amount_paid: 0
          })
        }
      }
    }

    // 4. INSERT
    if (invoicesToCreate.length === 0) {
      return { 
        success: true, 
        message: "No invoices due in the next 7 days." 
      }
    }

    const { error } = await (supabase.from('invoices') as any).insert(invoicesToCreate)
    if (error) throw error

    revalidatePath('/dashboard/invoices')
    
    return { 
      success: true, 
      message: `Generated ${invoicesToCreate.length} invoices due this week.` 
    }

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

  await (supabase.from('invoices') as any)
    .update({ status: 'PENDING' })
    .in('id', invoiceIds)

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
// 4. RECORD PAYMENT (SMART WALLET LOGIC + RECEIPT)
// ==========================================

export async function recordPayment(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Extract Data
  const invoiceId = formData.get('invoice_id') as string
  const amountInput = Number(formData.get('amount')) 
  const method = formData.get('method') as string || 'MOMO'
  const notes = formData.get('notes') as string || ''
  const useWallet = formData.get('use_wallet') === 'on' 

  console.log("💰 PROCESSING PAYMENT:", { invoiceId, amountInput, useWallet })

  if (!invoiceId) throw new Error("Missing Invoice ID")

  // 2. Fetch Invoice & Lease Details (UPDATED QUERY)
  // We now fetch tenants(name, phone) and units(unit_number) here too
  const { data: invoice } = await (supabase.from('invoices') as any)
    .select(`
      *, 
      leases (
        id, 
        credit_balance,
        tenants (name, phone),
        units (unit_number)
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (!invoice) throw new Error("Invoice not found")
  
  // SAFE LEASE ID EXTRACTION
  // @ts-ignore
  const leaseId = invoice.lease_id || invoice.leases?.id
  if (!leaseId) throw new Error("Critical Error: No Lease ID found for this invoice")

  // 3. Calculate Wallet Logic
  // @ts-ignore
  const amountDue = Number(invoice.amount) - (Number(invoice.amount_paid) || 0)
  // @ts-ignore
  const currentWallet = Number(invoice.leases?.credit_balance) || 0
  
  console.log("📊 STATUS:", { amountDue, currentWallet, leaseId })

  let walletContribution = 0
  let cashContribution = amountInput
  
  // IF USER WANTS TO USE WALLET
  if (useWallet && currentWallet > 0) {
    walletContribution = Math.min(amountDue, currentWallet)
  }

  const totalPayment = walletContribution + cashContribution
  
  // 4. Calculate New Status
  let newStatus = 'PARTIAL'
  let creditToWallet = 0 
  let paymentForInvoice = 0

  if (totalPayment >= amountDue) {
    // FULL PAYMENT OR OVERPAYMENT
    newStatus = 'PAID'
    paymentForInvoice = amountDue
    creditToWallet = totalPayment - amountDue 
  } else {
    // PARTIAL PAYMENT
    newStatus = 'PARTIAL'
    paymentForInvoice = totalPayment
  }

  // ==========================================
  // 5. EXECUTE DATABASE UPDATES
  // ==========================================

  // A. Record WALLET Transaction (If used)
  if (walletContribution > 0) {
    await (supabase.from('payments') as any).insert({
      invoice_id: invoiceId,
      lease_id: leaseId, 
      amount: walletContribution,
      method: 'WALLET',
      notes: 'Applied from credit balance',
      payment_date: new Date().toISOString()
    })

    // Deduct from Lease Wallet
    await (supabase.from('leases') as any).update({
      credit_balance: currentWallet - walletContribution
    }).eq('id', leaseId)
  }

  // B. Record CASH Transaction (If used)
  if (cashContribution > 0) {
    await (supabase.from('payments') as any).insert({
      invoice_id: invoiceId,
      lease_id: leaseId, 
      amount: cashContribution,
      method,
      notes,
      payment_date: new Date().toISOString()
    })
  }

  // C. Update Invoice Status
  const { error: invError } = await (supabase.from('invoices') as any)
    .update({
      status: newStatus,
      // @ts-ignore
      amount_paid: (Number(invoice.amount_paid) || 0) + paymentForInvoice,
      payment_date: new Date().toISOString()
    })
    .eq('id', invoiceId)

  if (invError) console.error("Invoice Update Error:", invError)

  // D. Handle New Overflow (Add to Wallet)
  if (creditToWallet > 0) {
    const { data: freshLease } = await (supabase.from('leases') as any).select('credit_balance').eq('id', leaseId).single()
    const freshCredit = Number(freshLease?.credit_balance) || 0
    
    await (supabase.from('leases') as any)
      .update({
        credit_balance: freshCredit + creditToWallet
      })
      .eq('id', leaseId)
    
    console.log(`✅ ADDED ${creditToWallet} TO WALLET`)
  }

  // ==========================================
  // 6. SEND RECEIPT VIA WHATSAPP (NEW)
  // ==========================================
  try {
    // @ts-ignore
    const phone = formatToRwandaNumber(invoice.leases?.tenants?.phone)
    // @ts-ignore
    const name = invoice.leases?.tenants?.name
    // @ts-ignore
    const unit = invoice.leases?.units?.unit_number
    
    // Only send if we have a valid phone number
    if (phone && phone.length >= 10) {
      const receiptAmount = totalPayment.toLocaleString()
      const date = new Date().toLocaleDateString('en-GB') // DD/MM/YYYY
      
      const receiptText = 
`🧾 *PAYMENT RECEIPT*
Hello ${name},
Payment received for Unit ${unit}.

💵 *Amount:* ${receiptAmount} RWF
📅 *Date:* ${date}
✅ *Status:* ${newStatus}
${creditToWallet > 0 ? `💰 *Wallet Credit:* ${creditToWallet.toLocaleString()} RWF added.` : ''}

Thank you!`

      // Fire and forget (don't await strictly, so it doesn't block the UI return)
      await sendToWaSender({ to: phone, text: receiptText })
      console.log(`✅ Receipt Sent to ${name}`)
    }
  } catch (receiptError) {
    console.error("⚠️ Failed to send receipt:", receiptError)
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/tenants')
  
  return { 
    success: true, 
    message: creditToWallet > 0 
      ? `Paid! ${creditToWallet.toLocaleString()} RWF added to wallet.` 
      : 'Payment recorded successfully.' 
  }
}