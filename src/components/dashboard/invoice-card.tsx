import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Wallet, Building2, User } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface InvoiceCardProps {
  invoice: any
  isSelected: boolean
  onToggle: (id: string) => void
  onView: (invoice: any) => void
}

export function InvoiceCard({ invoice, isSelected, onToggle, onView }: InvoiceCardProps) {
  const hasCredit = (invoice.leases?.credit_balance || 0) >= invoice.amount

  // Format Helper
  const formattedDueDate = new Date(invoice.due_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <Card className={`relative transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'hover:border-gray-400'}`}>
      
      {/* Selection Checkbox (Top Right) */}
      <div className="absolute top-3 right-3 z-10">
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(invoice.id)} />
      </div>

      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
               <Building2 className="h-4 w-4 text-slate-600" />
             </div>
             <div>
               <h3 className="font-bold text-lg">{invoice.leases.units.unit_number}</h3>
               <p className="text-xs text-muted-foreground">{invoice.leases.units.properties?.name}</p>
             </div>
          </div>
          <Badge variant="outline" className="mr-6 bg-yellow-50 text-yellow-700 border-yellow-200">
             Draft
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-3">
        {/* Tenant Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{invoice.leases.tenants.name}</span>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-end border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-xl font-mono font-bold text-primary">
              {Number(invoice.amount).toLocaleString()} <span className="text-xs text-muted-foreground">RWF</span>
            </p>
          </div>
        </div>

        {/* Wallet Badge */}
        {invoice.leases?.credit_balance > 0 && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${hasCredit ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            <Wallet className="h-3 w-3" />
            <span>Wallet: {Number(invoice.leases.credit_balance).toLocaleString()}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50 dark:bg-slate-900/50 p-2 px-4 flex justify-between items-center rounded-b-lg">
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <CalendarDays className="h-3 w-3" />
          {/* ✅ FIXED: Now shows DD/MM/YYYY */}
          Due: {formattedDueDate}
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600 h-8" onClick={() => onView(invoice)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}