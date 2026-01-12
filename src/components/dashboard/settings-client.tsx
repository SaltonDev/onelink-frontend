'use client'

import { useState } from 'react'
import { updateEmail, updatePassword } from '@/app/dashboard/settings/action'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Lock, Mail, User } from "lucide-react"

export function SettingsClient({ user }: { user: any }) {
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)

  // --- HANDLE EMAIL UPDATE ---
  async function handleEmail(formData: FormData) {
    setLoadingEmail(true)
    const promise = updateEmail(formData)

    toast.promise(promise, {
      loading: 'Updating email...',
      success: (res) => {
        if (res.success) return res.message
        else throw new Error(res.message)
      },
      error: (err) => err.message
    })

    try { await promise } catch (e) {} finally { setLoadingEmail(false) }
  }

  // --- HANDLE PASSWORD UPDATE ---
  async function handlePassword(formData: FormData) {
    setLoadingPass(true)
    const promise = updatePassword(formData)

    toast.promise(promise, {
      loading: 'Updating password...',
      success: (res) => {
        if (res.success) {
            // Optional: Reset form fields manually if needed
            return res.message
        } 
        else throw new Error(res.message)
      },
      error: (err) => err.message
    })

    try { await promise } catch (e) {} finally { setLoadingPass(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Security</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: EMAIL / ACCOUNT --- */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your contact email. You will need to verify the change via email.
              </CardDescription>
            </CardHeader>
            <form action={handleEmail}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="email" 
                            name="email" 
                            defaultValue={user?.email} 
                            className="pl-9" 
                            type="email" 
                            required 
                        />
                    </div>
                </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4">
                    <Button disabled={loadingEmail}>
                        {loadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Email"}
                    </Button>
                </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* --- TAB 2: PASSWORD --- */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Choose a strong password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <form action={handlePassword}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current">New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="password" 
                            name="password" 
                            type="password" 
                            className="pl-9" 
                            required 
                            minLength={6}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new">Confirm Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            type="password" 
                            className="pl-9" 
                            required 
                            minLength={6}
                        />
                    </div>
                </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4">
                    <Button disabled={loadingPass}>
                        {loadingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                    </Button>
                </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}