'use client'

import { useState } from 'react'
import { forgotPassword } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Building2, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const result = await forgotPassword(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setMessage("Reset link sent! Please check your email inbox.")
    }
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
          <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-sm text-gray-500">Enter your email to receive a reset link.</p>
        </CardHeader>

        <CardContent>
          {message ? (
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-gray-700 font-medium">{message}</p>
              <Button asChild className="w-full bg-gray-900"><Link href="/">Back to Login</Link></Button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Enter your email" required />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </Button>
              <div className="text-center">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="mt-8 text-center text-sm text-gray-400">© 2026 OneLink Properties.</div>
    </div>
  )
}