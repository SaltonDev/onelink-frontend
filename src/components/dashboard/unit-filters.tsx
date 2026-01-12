'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { SearchIcon, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function UnitFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Helper to update URL params
  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2">
      {/* 1. SEARCH INPUT */}
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          className="pl-9 bg-background"
          placeholder="Search unit number..."
          onChange={(e) => updateParams('query', e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>

      {/* 2. STATUS FILTER */}
      <Select 
        defaultValue={searchParams.get('status') || 'ALL'} 
        onValueChange={(val) => updateParams('status', val)}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <Filter className="mr-2 h-4 w-4 text-gray-500" />
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="VACANT">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              Vacant
            </span>
          </SelectItem>
          <SelectItem value="OCCUPIED">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
              Occupied
            </span>
          </SelectItem>
          <SelectItem value="MAINTENANCE">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
              Maintenance
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}