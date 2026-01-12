'use client'

import { useState } from 'react'
import { updatePassword } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    const result = await updatePassword(formData)
    if (result?.error) setError(result.error)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center mb-8 space-y-2">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
          <Building2 className="text-white h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">OneLink</h1>
      </div>

      <Card className="w-full max-w-[400px] shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-bold text-gray-900">Set New Password</h2>
          <p className="text-sm text-gray-500">Please enter your new password below.</p>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}