'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation' // <--- 1. Import the hook
import { login } from '@/app/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react" 
import Link from 'next/link'

// 2. Remove props (searchParams) from here
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 3. Use the hook to get the error securely
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    await login(formData)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      
      {/* 1. Header Section (Logo) */}
      <div className="flex flex-col items-center mb-8 space-y-2">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
          <Building2 className="text-white h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">OneLink</h1>
        <p className="text-gray-500 text-sm">Property Management System</p>
      </div>

      {/* 2. The White Card */}
      <Card className="w-full max-w-[400px] shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500">
            Enter your credentials to access your dashboard
          </p>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            
            {/* Error Message - Using the variable 'error' we got from the hook */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center border border-red-100">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-gray-700">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="Enter your email" 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                required 
              />
            </div>

            {/* Password Field with Eye Icon */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white pr-10 transition-all"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-gray-300" />
                <label
                  htmlFor="remember"
                  className="text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>
              <Link 
                href="/forgot-password" 
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Footer Text inside Card */}
            <div className="text-center text-sm text-gray-500 pt-2">
              Need access to Rento? <span className="text-blue-600 font-medium cursor-pointer hover:underline">Contact Administrator</span>
            </div>

          </form>
        </CardContent>
      </Card>

      {/* 3. Page Footer */}
      <div className="mt-8 text-center text-sm text-gray-400">
        © 2024 OneLink Properties. All rights reserved.
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  )
}