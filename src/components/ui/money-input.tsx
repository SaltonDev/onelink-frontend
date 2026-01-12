'use client'

import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface MoneyInputProps {
  name: string
  placeholder?: string
  required?: boolean
  defaultValue?: number
}

export function MoneyInput({ name, placeholder, required, defaultValue }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (defaultValue) {
      setDisplayValue(defaultValue.toLocaleString())
    }
  }, [defaultValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove non-digits
    const rawValue = e.target.value.replace(/,/g, "")
    if (isNaN(Number(rawValue))) return

    // 2. Format with commas for display
    const numberValue = Number(rawValue)
    setDisplayValue(numberValue.toLocaleString())
  }

  return (
    <>
      {/* Visual Input (User sees commas) */}
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="font-mono"
      />
      {/* Hidden Input (Server receives raw number) */}
      <input 
        type="hidden" 
        name={name} 
        value={displayValue.replace(/,/g, "")} 
      />
    </>
  )
}