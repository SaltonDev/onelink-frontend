import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const payload = await request.json()
    
    // Log it so you can see exactly what WaSender sends in your terminal
    console.log("🪝 Webhook received:", JSON.stringify(payload, null, 2))

    const eventType = payload.event // e.g., "message.sent"
    const data = payload.data

    if (!data) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    // 1. EXTRACT THE ID
    // Your JSON format: data.key.id
    const messageId = data.key?.id

    if (!messageId) {
      console.log("⚠️ Webhook ignored: No Message ID found")
      return NextResponse.json({ message: 'No ID' }, { status: 200 })
    }

    // 2. DETERMINE NEW STATUS
    let newStatus = 'PENDING'

    if (data.success === false) {
      newStatus = 'FAILED' // The API explicitly said it failed
    } else if (eventType === 'message.sent') {
      newStatus = 'SENT'
    } else if (eventType === 'message.delivered') { // Future proofing
      newStatus = 'DELIVERED'
    } else if (eventType === 'message.read') { // Future proofing
      newStatus = 'READ'
    } else {
      // If we don't recognize the event, just ignore it
      return NextResponse.json({ success: true })
    }

    // 3. UPDATE DATABASE
    // We look for the invoice that has this specific WhatsApp ID
    // FIX: We cast the table reference to 'any' so TypeScript stops checking the table definition
    const { error } = await (supabase.from('invoices') as any)
      .update({ delivery_status: newStatus })
      .eq('whatsapp_message_id', messageId)

    if (error) {
      console.error("❌ Failed to update DB:", error)
      return NextResponse.json({ message: 'DB Error' }, { status: 500 })
    }

    console.log(`✅ Invoice Status Updated: ${newStatus} (ID: ${messageId})`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ Webhook Server Error:", error)
    return NextResponse.json({ message: 'Server Error' }, { status: 500 })
  }
}