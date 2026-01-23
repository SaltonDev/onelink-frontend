import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const payload = await request.json()
    
    // Log the RAW payload so we can verify the structure in Vercel Logs
    console.log("🪝 WEBHOOK RECEIVED:", JSON.stringify(payload, null, 2))

    const eventType = payload.event 

    // ====================================================
    // HANDLE 'messages.update' (Delivered, Read, Sent)
    // ====================================================
    if (eventType === 'messages.update') {
      const data = payload.data
      
      // 1. EXTRACT ID
      // Documentation says: data.key.id
      const messageId = data?.key?.id

      if (!messageId) {
        console.log("⚠️ Ignored: No Message ID in payload")
        return NextResponse.json({ success: true })
      }

      // 2. EXTRACT STATUS
      // Documentation says: data.update.status (Integer)
      // 0=ERROR, 2=SENT, 3=DELIVERED, 4=READ
      const statusCode = data?.update?.status
      let newStatus = 'PENDING'

      // Map the numeric codes to your Database Enums
      switch (statusCode) {
        case 2:
          newStatus = 'SENT'
          break
        case 3:
          newStatus = 'DELIVERED'
          break
        case 4:
          newStatus = 'READ'
          break
        case 5:
          newStatus = 'READ' // "Played" (for audio) counts as read
          break
        case 0:
          newStatus = 'FAILED'
          break
        default:
          console.log(`ℹ️ Unknown Status Code: ${statusCode}`)
          return NextResponse.json({ success: true })
      }

      // 3. UPDATE DATABASE
      // Cast to 'any' to bypass TS errors on the table definition
      const { error } = await (supabase.from('invoices') as any)
        .update({ delivery_status: newStatus })
        .eq('whatsapp_message_id', messageId)

      if (error) {
        console.error("❌ DB Update Error:", error)
        return NextResponse.json({ error: 'DB Error' }, { status: 500 })
      }

      console.log(`✅ Invoice Updated: ${newStatus} (ID: ${messageId})`)
      return NextResponse.json({ success: true })
    }

    // ====================================================
    // HANDLE OTHER EVENTS (Optional)
    // ====================================================
    // You might get 'messages.upsert' when YOU send a message too
    
    console.log(`ℹ️ Ignored Event Type: ${eventType}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ Webhook Server Error:", error)
    return NextResponse.json({ message: 'Server Error' }, { status: 500 })
  }
}