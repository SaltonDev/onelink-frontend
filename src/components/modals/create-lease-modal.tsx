'use client'

import { useState } from 'react'
import { createLease } from '@/app/dashboard/tenants/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { MoneyInput } from "@/components/ui/money-input"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreateLeaseProps {
  tenants: any[]
  vacantUnits: any[]
}

export function CreateLeaseModal({ tenants, vacantUnits }: CreateLeaseProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form State
  const [tenantId, setTenantId] = useState("")
  const [unitId, setUnitId] = useState("")
  const [rentAmount, setRentAmount] = useState<any>("") // Allow any to handle number/string
  const [startDate, setStartDate] = useState("") 
  
  // Combobox Open States
  const [openTenantBox, setOpenTenantBox] = useState(false)
  const [openUnitBox, setOpenUnitBox] = useState(false)

  // LOGIC: Auto-fill rent when unit is selected
  const handleUnitSelect = (selectedId: string) => {
    setUnitId(selectedId)
    setOpenUnitBox(false)
    
    // Find the unit to get the price
    const unit = vacantUnits.find(u => u.id === selectedId)
    if (unit) {
      // We set the rent immediately so it appears in the box
      setRentAmount(unit.rent_amount)
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // Manual overrides 
    if (tenantId) formData.set('tenant_id', tenantId)
    if (unitId) formData.set('unit_id', unitId)
    
    // Ensure we send the clean number for rent
    // MoneyInput usually handles formatting, we just need the raw value
    if (rentAmount) formData.set('rent_amount', rentAmount.toString().replace(/,/g, ''))

    const promise = createLease(formData)

    toast.promise(promise, {
      loading: 'Creating contract...',
      success: (result) => {
        if (result.success) {
          setOpen(false)
          // Reset form on success
          setTenantId("")
          setUnitId("")
          setRentAmount("")
          setStartDate("")
          return 'Lease created successfully'
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || 'Failed to create lease'
    })

    try { await promise } catch (e) {} 
    finally { setIsLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Lease</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 mt-4">
          
          {/* 1. SELECT TENANT */}
          <div className="space-y-2 flex flex-col">
            <Label>Select Tenant</Label>
            <Popover open={openTenantBox} onOpenChange={setOpenTenantBox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openTenantBox}
                  className="justify-between font-normal text-left w-full"
                >
                  {tenantId
                    ? tenants.find((t) => t.id === tenantId)?.name
                    : "Search tenant..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[460px]" align="start">
                <Command>
                  <CommandInput placeholder="Search tenant name..." />
                  <CommandList>
                    <CommandEmpty>No tenant found.</CommandEmpty>
                    <CommandGroup>
                      {tenants.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={t.name}
                          onSelect={() => {
                            setTenantId(t.id)
                            setOpenTenantBox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              tenantId === t.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{t.name}</span>
                            <span className="text-xs text-muted-foreground">{t.phone}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="tenant_id" value={tenantId} required />
          </div>

          {/* 2. SELECT UNIT */}
          <div className="space-y-2 flex flex-col">
            <Label>Select Vacant Unit</Label>
            <Popover open={openUnitBox} onOpenChange={setOpenUnitBox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openUnitBox}
                  className="justify-between font-normal text-left w-full"
                >
                  {unitId
                    ? (() => {
                        const u = vacantUnits.find((u) => u.id === unitId)
                        return u ? `${u.unit_number} — ${u.property_name}` : "Select unit..."
                      })()
                    : "Search unit..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[460px]" align="start">
                <Command>
                  <CommandInput placeholder="Search unit number..." />
                  <CommandList>
                    <CommandEmpty>No vacant units available.</CommandEmpty>
                    <CommandGroup>
                      {vacantUnits.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={`${u.unit_number} ${u.property_name}`}
                          onSelect={() => handleUnitSelect(u.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              unitId === u.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{u.unit_number} — {u.property_name}</span>
                            <span className="text-xs text-muted-foreground">Rent: {Number(u.rent_amount).toLocaleString()} RWF</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="unit_id" value={unitId} required />
          </div>

          {/* 3. DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                name="start_date" 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input name="end_date" type="date" />
            </div>
          </div>

          {/* 4. RENT AMOUNT */}
          <div className="space-y-2">
            <Label>Monthly Rent (RWF)</Label>
            {/* KEY FIX: `key={unitId}` forces the component to re-render when unit changes.
                This guarantees the new value is loaded into the input visible to the user.
            */}
            <MoneyInput 
              key={unitId || 'default'} 
              name="rent_amount" 
              placeholder="0" 
              defaultValue={rentAmount} // Use defaultValue with key to reset
              // @ts-ignore
              onChange={(e: any) => setRentAmount(e.target.value)} 
              required 
            />
            {/* Helper message showing logic */}
            {unitId && (
               <p className="text-xs text-muted-foreground">
                 Standard rent for this unit loaded. You can change this if giving a discount.
               </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}