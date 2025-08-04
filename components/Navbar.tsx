'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import NotificationSystem from './NotificationSystem'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout: authLogout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        authLogout()
        toast.success('Logged out successfully')
        router.push('/')
      }
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'admin': return '/admin'
      case 'restaurant': return '/seller'
      case 'delivery': return '/delivery'
      default: return '/profile'
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            FoodFusion
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary">Home</Link>
            <Link href="/restaurants" className="text-gray-700 hover:text-primary">Restaurants</Link>
            {user && (
              <Link href="/orders" className="text-gray-700 hover:text-primary">Orders</Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Search className="h-6 w-6 text-gray-600 cursor-pointer" />
            {user && <NotificationSystem />}
            {user && user.role === 'customer' && (
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            )}
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden md:block">{user.name}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}