'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react" // Optional icon

export function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = (term: string) => {
    // We convert to string to ensure TS is happy
    const params = new URLSearchParams(searchParams.toString())
    
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    // Updates the URL without reloading the page
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex-1 flex-shrink-0">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        className="pl-9 bg-white" // Add padding-left for the icon
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        // Keep the input in sync with the URL
        defaultValue={searchParams.get('query')?.toString()}
      />
    </div>
  )
}