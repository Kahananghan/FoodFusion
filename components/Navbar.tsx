'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, LogOut, Settings, Menu, X, MapPin, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import NotificationSystem from './NotificationSystem'
import { useAuth } from '@/contexts/AuthContext'


export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const { user, logout: authLogout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Don't render navbar on admin routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/seller') || pathname?.startsWith('/delivery')) {
    return null
  }

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const response = await fetch('/api/cart')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.cartItems) {
            const count = data.cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
            setCartCount(count)
          } else {
            setCartCount(0)
          }
        } else {
          setCartCount(0)
        }
      } catch {
        setCartCount(0)
      }
    }

    updateCartCount()
    
    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

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
    <>
      
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Delivering to Delhi, Mumbai, Bangalore</span>
              </div>
            </div>
            <div className="text-primary font-medium">
              Free delivery on orders over ₹500!
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <span className="text-white font-bold text-lg">🍽️</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">FoodFusion</span>
                <span className="text-xs text-gray-500 font-medium -mt-1">Fast Delivery</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/' ? 'text-primary' : ''}`}>
                Home
              </Link>
              <Link href="/restaurants" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/restaurants' ? 'text-primary' : ''}`}>
                Restaurants
              </Link>
              {user && (
                <Link href="/orders" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/orders' ? 'text-primary' : ''}`}>
                  My Orders
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search - Desktop Only */}
              <button 
                onClick={() => setShowSearch(true)}
                className="hidden md:block p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {/* Notifications - Desktop Only */}
              {user && <div className="hidden md:block"><NotificationSystem /></div>}
              
              {/* Cart - Desktop Only */}
              {user && user.role === 'customer' && (
                <Link href="/cart" className="hidden md:block relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-all">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              
              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden lg:block font-medium">{user.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href={getDashboardLink()}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105 font-medium shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Action Icons */}
              <div className="flex items-center justify-around py-4 border-b border-gray-200">
                <button 
                  onClick={() => setShowSearch(true)}
                  className="flex flex-col items-center space-y-1 text-gray-600 hover:text-primary"
                >
                  <Search className="h-6 w-6" />
                  <span className="text-xs font-medium">Search</span>
                </button>
                
                {user && (
                  <div className="flex flex-col items-center space-y-1">
                    <NotificationSystem />
                    <span className="text-xs font-medium text-gray-600">Notifications</span>
                  </div>
                )}
                
                {user && user.role === 'customer' && (
                  <Link href="/cart" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-primary" onClick={() => setShowMobileMenu(false)}>
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium">Cart</span>
                  </Link>
                )}
              </div>
              
              {/* Navigation Links */}
              <Link href="/" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>
                Home
              </Link>
              <Link href="/restaurants" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>
                Restaurants
              </Link>
              {user && (
                <Link href="/orders" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>
                  My Orders
                </Link>
              )}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full text-center py-2 text-gray-700 hover:text-primary font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full text-center bg-primary text-white py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center pt-16 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 transform animate-slideDown">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <input
                  type="text"
                  placeholder="Search restaurants, cuisines, dishes..."
                  className="flex-1 outline text-lg px-3 py-2 bg-white text-black rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`)
                      setShowSearch(false)
                      setSearchQuery('')
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`)
                      setShowSearch(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-orange-50 rounded-xl flex items-center space-x-4 transition-all group border border-transparent hover:border-primary/20"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Search for "{searchQuery}"</p>
                      <p className="text-sm text-gray-500">Find restaurants and dishes</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {/* Quick Suggestions */}
            {!searchQuery.trim() && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {['Pizza', 'Burger', 'Chinese', 'Indian', 'Italian'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        router.push(`/restaurants?search=${encodeURIComponent(term)}`)
                        setShowSearch(false)
                        setSearchQuery('')
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-primary/10 hover:text-primary rounded-full text-sm font-medium transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-b-2xl">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>💡 Tip: Try searching for cuisines or restaurant names</span>
                <span className="text-xs bg-white px-2 py-1 rounded-md font-medium">Press Enter ↵</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}