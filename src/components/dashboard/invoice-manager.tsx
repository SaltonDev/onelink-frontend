'use client'

import { useState } from 'react'
import { generateMonthlyInvoices, approveAndSendInvoices } from '@/app/dashboard/invoices/action' // Adjusted import path
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox" // <--- 1. Import Checkbox
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Send, PlusCircle, AlertCircle } from "lucide-react"
import { InvoiceCard } from "./invoice-card"
import { InvoiceDetailsDialog } from "./invoice-details-dialog"
import { toast } from "sonner"

interface InvoiceManagerProps {
  initialInvoices: any[]
  onRefresh: () => void 
}

export function InvoiceManager({ initialInvoices, onRefresh }: InvoiceManagerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<any>(null)

  const drafts = initialInvoices.filter(inv => inv.status === 'DRAFT')

  // --- NEW: TOGGLE ALL LOGIC ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select ALL draft IDs
      setSelectedIds(drafts.map(i => i.id))
    } else {
      // Deselect ALL
      setSelectedIds([])
    }
  }

  // Helper to check if "All" is currently selected
  const isAllSelected = drafts.length > 0 && selectedIds.length === drafts.length

  // --- ACTIONS ---
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateMonthlyInvoices()
      if (result.success) {
        toast.success(result.message)
        onRefresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to generate invoices")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendSelected = async () => {
    if (selectedIds.length === 0) return
    setIsSending(true)
    try {
      await approveAndSendInvoices(selectedIds)
      toast.success(`Successfully sent ${selectedIds.length} invoices!`)
      setSelectedIds([])
      onRefresh()
    } catch (error) {
      toast.error("Error sending invoices")
    } finally {
      setIsSending(false)
    }
  }

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-6">
      
      {/* TOP ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          
          {/* --- NEW: SELECT ALL CHECKBOX --- */}
          {drafts.length > 0 && (
            <div className="flex items-center gap-2 border-r pr-4 mr-1">
              <Checkbox 
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              />
              <label 
                htmlFor="select-all" 
                className="text-sm font-medium cursor-pointer select-none"
              >
                Select All
              </label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {drafts.length} Pending
            </Badge>
          </div>
          
          {selectedIds.length > 0 && (
            <span className="text-sm text-blue-600 font-medium animate-in fade-in">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {drafts.length === 0 ? (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Generate Monthly Invoices
            </Button>
          ) : (
            <Button 
              onClick={handleSendSelected} 
              disabled={selectedIds.length === 0 || isSending}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white transition-all"
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Approve & Send Selected
            </Button>
          )}
        </div>
      </div>

      {/* GRID VIEW */}
      {drafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drafts.map((inv) => (
            <InvoiceCard 
              key={inv.id} 
              invoice={inv} 
              isSelected={selectedIds.includes(inv.id)}
              onToggle={() => toggleSelectOne(inv.id)}
              onView={(inv) => setViewInvoice(inv)} 
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                <p>No drafts pending review.</p>
                <p className="text-xs text-gray-400">Click "Generate" to start the billing cycle.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL */}
      <InvoiceDetailsDialog 
        invoice={viewInvoice} 
        isOpen={!!viewInvoice} 
        onClose={() => setViewInvoice(null)} 
      />
    </div>
  )
}