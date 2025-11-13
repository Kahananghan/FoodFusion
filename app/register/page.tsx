'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/CustomToaster'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // client-side validation
    const pwd = formData.password || ''
    const failed = validatePassword(pwd)
    if (failed.length > 0) {
      toast.error('Password does not meet requirements')
      setPasswordTouched(true)
      return
    }
    // Phone validation (if provided) - must be 10 digits
    const phoneVal = (formData.phone || '')
    if (phoneVal && !/^\d{10}$/.test(phoneVal)) {
      toast.error('Phone number must be 10 digits')
      setPhoneTouched(true)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Registration successful!')
        router.push('/login')
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const passwordRules = useMemo(() => ([
    { id: 'length', label: 'At least 8 characters', test: (s: string) => s.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', test: (s: string) => /[A-Z]/.test(s) },
    { id: 'lower', label: 'One lowercase letter', test: (s: string) => /[a-z]/.test(s) },
    { id: 'number', label: 'One number', test: (s: string) => /[0-9]/.test(s) },
    { id: 'special', label: 'One special character (!@#$...)', test: (s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s) }
  ]), [])

  const validatePassword = (pwd: string) => {
    return passwordRules.filter(r => !r.test(pwd)).map(r => r.label)
  }

  const passwordErrors = validatePassword(formData.password || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our food delivery platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setPasswordTouched(true) }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Show only remaining (unmet) password rules after the user touched the field */}
              {passwordTouched && (() => {
                const remaining = passwordRules.filter(r => !r.test(formData.password || ''))
                if (remaining.length === 0) return null
                return (
                  <div className="mt-2 text-sm">
                    <ul className="space-y-1">
                      {remaining.map(rule => (
                        <li key={rule.id} className="flex items-center gap-2 text-red-600">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center border border-red-300 bg-red-50" />
                          <span className="text-xs">{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your phone"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setPhoneTouched(true) }}
                />
              </div>
              {phoneTouched && formData.phone && !/^\d{10}$/.test(formData.phone) && (
                <p className="text-xs text-red-600 mt-2">Phone number must be exactly 10 digits.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Address Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
              <input
                type="text"
                placeholder="City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
              />
              <input
                type="text"
                placeholder="State"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
              />
              <input
                type="text"
                placeholder="ZIP Code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}