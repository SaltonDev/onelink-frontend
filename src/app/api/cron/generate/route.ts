import { NextResponse } from 'next/server'
import { generateMonthlyInvoices } from '@/app/dashboard/invoices/action'

// This route will be triggered automatically
export async function GET(request: Request) {
  // 1. Security Check (Optional but recommended)
  // Check for a secret key so strangers can't trigger your billing
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log("⏰ Cron Job Started: Generating Invoices...")
    
    // 2. Run your existing logic
    await generateMonthlyInvoices()
    
    return NextResponse.json({ success: true, message: 'Invoices generated successfully' })
  } catch (error) {
    console.error("Cron Failed:", error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}