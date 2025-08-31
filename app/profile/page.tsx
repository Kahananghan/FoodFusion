'use client'

import { useState, useEffect } from 'react'
import { User as UserIcon, Mail, Phone, MapPin, Edit, Calendar, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Loader from '@/components/Loader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function Profile() {
  const { user, loading, refreshUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  // Sync form whenever user changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || ''
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
            phone: form.phone || undefined,
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode
          }
        })
      })
      if (res.ok) {
        await refreshUser()
        setOpen(false)
      } else {
        console.error('Failed to update profile')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader fullscreen message="Loading profile" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                <UserIcon className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground pb-8">Please login to view your profile.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white py-12 px-4">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-3">
        {/* Left column: profile summary */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex-row items-start gap-4 pb-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-sm tracking-wide">{user.name?.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl font-semibold text-neutral-800 leading-tight">{user.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="capitalize">{user.role}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500"><ShieldCheck className="h-3.5 w-3.5" /> Active</span>
                  {user.createdAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500"><Calendar className="h-3.5 w-3.5" /> {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">Email</p>
                    <p className="font-medium text-neutral-700 break-all">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">Phone</p>
                      <p className="font-medium text-neutral-700">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">Address</p>
                      <p className="font-medium text-neutral-700 whitespace-pre-line leading-relaxed">{`${user.address.street}\n${user.address.city}, ${user.address.state} ${user.address.zipCode}`}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2" variant="secondary"><Edit className="h-4 w-4" /> Edit Profile</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your personal information and address.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 text-neutral-700">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="name">Name</label>
                        <Input id="name" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="phone">Phone</label>
                        <Input id="phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Optional" />
                      </div>
                      <Separator />
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="street">Street</label>
                        <Textarea id="street" value={form.street} onChange={e => handleChange('street', e.target.value)} rows={2} />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium" htmlFor="city">City</label>
                          <Input id="city" value={form.city} onChange={e => handleChange('city', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium" htmlFor="state">State</label>
                          <Input id="state" value={form.state} onChange={e => handleChange('state', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium" htmlFor="zip">ZIP</label>
                          <Input id="zip" value={form.zipCode} onChange={e => handleChange('zipCode', e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: detailed cards */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-neutral-800">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Email</span>
                  <span className="font-medium break-all">{user.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Phone</span>
                  <span className="font-medium">{user.phone || '—'}</span>
                </div>
                <Separator />
                <div className="space-y-1">
                  <span className="text-sm text-neutral-500">Address</span>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{user.address ? `${user.address.street}\n${user.address.city}, ${user.address.state} ${user.address.zipCode}` : '—'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-neutral-800">Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Role</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Member Since</span>
                  <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Status</span>
                  <Badge variant="secondary" className="bg-green-500 text-white border-transparent">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}