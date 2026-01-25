'use client'

import { useState, useMemo } from 'react'
import { UnitActions } from '@/components/dashboard/unit-actions'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Trash2, FileDown } from "lucide-react" // <--- Added FileDown
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// IMPORT THE GENERATOR
import { generateUnitListPDF } from '@/utils/unit-list-generator'

interface Unit {
  id: string
  unit_number: string
  floor_number: string
  rent_amount: number
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
  property_id: string
}

// Update props to accept propertyName
export function UnitListClient({ units, propertyName }: { units: Unit[], propertyName: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())

  // --- FILTER LOGIC ---
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // 1. Search Filter
      const matchesSearch = unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 2. Status Filter
      const matchesStatus = statusFilter === 'ALL' || unit.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [units, searchQuery, statusFilter])

  // --- EXPORT FUNCTION ---
  const handleExport = () => {
    generateUnitListPDF({
      propertyName: propertyName || 'Property',
      units: filteredUnits,
      filterStatus: statusFilter
    })
  }

  // --- SELECTION LOGIC ---
  const isAllSelected = filteredUnits.length > 0 && selectedUnits.size === filteredUnits.length

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUnits(new Set())
    } else {
      const allIds = filteredUnits.map(u => u.id)
      setSelectedUnits(new Set(allIds))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedUnits)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedUnits(newSet)
  }

  return (
    <div className="space-y-4">
      
      {/* 1. FILTERS BAR */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search unit number..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg overflow-hidden flex-1 sm:flex-none overflow-x-auto">
            {['ALL', 'VACANT', 'OCCUPIED', 'MAINTENANCE'].map((status) => (
                <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap
                    ${statusFilter === status 
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                `}
                >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
            ))}
            </div>

            {/* EXPORT BUTTON */}
            <Button variant="outline" size="icon" onClick={handleExport} className="shrink-0">
                <FileDown className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* 2. BULK ACTIONS (Hidden unless items selected) */}
      {selectedUnits.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg flex items-center justify-between border border-blue-100 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedUnits.size} selected
          </span>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8">
             <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
          </Button>
        </div>
      )}

      {/* 3. TABLE */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Unit Number</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Rent Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No units found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => (
                <TableRow key={unit.id} className="group">
                  <TableCell>
                    <Checkbox 
                      checked={selectedUnits.has(unit.id)}
                      onCheckedChange={() => toggleSelectOne(unit.id)}
                      aria-label={`Select unit ${unit.unit_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-semibold">{unit.unit_number}</TableCell>
                  <TableCell className="text-muted-foreground">{unit.floor_number || '-'}</TableCell>
                  <TableCell className="font-mono">{Number(unit.rent_amount).toLocaleString()} RWF</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`
                        ${unit.status === 'VACANT' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${unit.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${unit.status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                      `}
                    >
                      {unit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UnitActions unit={unit} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Showing {filteredUnits.length} of {units.length} units
      </div>

    </div>
  )
}