"use client"

import Link from 'next/link'
import { ShoppingCart, User, Search, LogOut, Settings, Menu, X, MapPin, Phone, ClipboardList, Store, Bike, Users2, ChevronDown, Loader2, History } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from '@/components/CustomToaster'
import NotificationSystem from './NotificationSystem'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; type: 'restaurant' | 'cuisine' }[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [cartCount, setCartCount] = useState(0)
  const { user, logout: authLogout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/seller') || pathname?.startsWith('/delivery')) return null

  // Cart count loader + listener
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const response = await fetch('/api/cart', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.cartItems) {
            const count = data.cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
            setCartCount(count)
          } else setCartCount(0)
        } else setCartCount(0)
      } catch { setCartCount(0) }
    }
    updateCartCount()
    const handle = () => updateCartCount()
    window.addEventListener('cartUpdated', handle)
    return () => window.removeEventListener('cartUpdated', handle)
  }, [])

  const handleLogout = async () => {
    try {
  const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        authLogout()
        toast.error('Logged out successfully')
        router.push('/')
      }
    } catch { toast.error('Logout failed') }
  }

  // Focus when opened
  useEffect(() => {
    if (searchOpen) {
      const id = requestAnimationFrame(() => searchInputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [searchOpen])

  // Load recent
  useEffect(() => {
    try { const stored = localStorage.getItem('recentSearches'); if (stored) setRecentSearches(JSON.parse(stored)) } catch {}
  }, [])

  const persistRecent = (term: string) => {
    if (!term.trim()) return
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 8)
      try { localStorage.setItem('recentSearches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Debounced suggestions
  useEffect(() => {
    setHighlightedIndex(-1)
    if (searchQuery.trim().length < 2) { setSuggestions([]); setLoadingSuggestions(false); return }
    let active = true
    setLoadingSuggestions(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/restaurants?search=${encodeURIComponent(searchQuery.trim())}&limit=25`, { signal: controller.signal })
        if (!res.ok) throw new Error('bad')
        const data = await res.json()
        if (!active) return
        const list = (data.restaurants || []).map((r: any) => ({ id: r.id, name: r.name, cuisines: r.cuisines || '' }))
        const cuisineTokens = new Set<string>()
        list.forEach((r:any) => r.cuisines.split(',').forEach((c: string) => { const token = c.trim(); if (token) cuisineTokens.add(token) }))
        const restSuggestions = list.slice(0, 6).map((r: any) => ({ id: r.id, name: r.name, type: 'restaurant' as const }))
        const cuisineSuggestions = Array.from(cuisineTokens).filter(c => c.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6).map(c => ({ id: c, name: c, type: 'cuisine' as const }))
        setSuggestions([...restSuggestions, ...cuisineSuggestions])
      } catch { if (active) setSuggestions([]) } finally { if (active) setLoadingSuggestions(false) }
    }, 300)
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [searchQuery])

  // Global shortcuts
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (!isTyping && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)))) { e.preventDefault(); setSearchOpen(true) }
      if (searchOpen && e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen])

  const executeSearch = (term: string, type: 'restaurant' | 'cuisine' | 'recent' | 'quick' = 'restaurant') => {
    const q = term.trim(); if (!q) return
    persistRecent(q)
    if (type === 'cuisine') {
      router.push(`/restaurants?cuisine=${encodeURIComponent(q)}`)
    } else {
      router.push(`/restaurants?search=${encodeURIComponent(q)}`)
    }
    setSearchOpen(false); setSearchQuery(''); setSuggestions([])
  }

  return (
    <>
      {/* Top Bar */}
      {/* <div className="bg-gray-900 text-white py-2 hidden md:block">
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
            <div className="text-primary font-medium">Free delivery on orders over ₹500!</div>
          </div>
        </div>
      </div> */}

      {/* Main Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 overflow-x-clip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group" aria-label="FoodFusion Home">
              <img src="/icons8-dish-100.png" alt="FoodFusion logo" className="h-14 w-14 rounded-md object-cover drop-shadow-sm" />
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent tracking-tight">FoodFusion</span>
                <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Fast • Fresh • Delivered</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/' ? 'text-primary' : ''}`}>Home</Link>
              <Link href="/restaurants" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/restaurants' ? 'text-primary' : ''}`}>Restaurants</Link>
              {user && <Link href="/orders" className={`text-gray-700 hover:text-primary font-medium transition-colors ${pathname === '/orders' ? 'text-primary' : ''}`}>My Orders</Link>}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="hidden md:inline-flex text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
              {user && <div className="hidden md:block"><NotificationSystem /></div>}
              {user && user.role === 'customer' && (
                <Link href="/cart" className="hidden md:block relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-all">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">{cartCount}</span>}
                </Link>
              )}
              {user ? (
                <div ref={userMenuRef} className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                  <Button variant="ghost" className="group flex items-center gap-2 px-2 pr-3 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-haspopup="menu" aria-expanded={userMenuOpen}
                    onFocus={() => setUserMenuOpen(true)} onBlur={(e: FocusEvent<HTMLButtonElement>) => { if (!(e.relatedTarget && userMenuRef.current?.contains(e.relatedTarget as Node))) setUserMenuOpen(false) }}
                    onKeyDown={(e: ReactKeyboardEvent<HTMLButtonElement>) => { if (e.key === 'Escape') setUserMenuOpen(false); if ((e.key === 'Enter' || e.key === ' ') && !userMenuOpen) { e.preventDefault(); setUserMenuOpen(true) } }}>
                    <div className="relative h-10 w-10">
                      <div className={`absolute inset-0 rounded-full p-[2px] transition-all duration-300 ${userMenuOpen ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_0_3px_rgba(255,107,53,0.25)]' : 'bg-gradient-to-br from-orange-300/40 via-orange-400/30 to-orange-500/40 opacity-0 group-hover:opacity-100'}`}></div>
                      <Avatar className="relative h-full w-full rounded-full bg-white shadow-sm ring-1 ring-orange-200 group-hover:ring-orange-300 transition-all"><AvatarFallback className="text-[12px] font-semibold tracking-wide text-orange-600 bg-gradient-to-br from-orange-50 to-orange-100">{user.name?.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase() || 'U'}</AvatarFallback></Avatar>
                    </div>
                    <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate text-gray-700 group-hover:text-primary">{user.name}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-primary' : 'group-hover:text-primary'}`} />
                  </Button>
                  {userMenuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-72 max-w-[92vw] rounded-xl border border-orange-100/80 bg-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.06)] overflow-hidden z-50 ring-1 ring-white/50">
                      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-orange-50/80 to-white border-b border-orange-100/70">
                        <p className="text-sm font-semibold leading-tight truncate text-gray-800" title={user.name}>{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate" title={user.email}>{user.email}</p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-100 text-[10px] font-medium tracking-wide px-2 py-0.5 text-orange-600 uppercase">{user.role}</span>
                      </div>
                      <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wide uppercase text-gray-400 bg-white/60">Quick Access</div>
                      <div className="py-1 max-h-[60vh] overflow-y-auto">
                        {user.role === 'customer' && (<>
                          <Link href="/profile" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><User className="h-4 w-4" /></span><span className="font-medium">Account</span></Link>
                          <Link href="/orders" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><ClipboardList className="h-4 w-4" /></span><span className="font-medium">My Orders</span></Link>
                          <Link href="/cart" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><ShoppingCart className="h-4 w-4" /></span><span className="font-medium">Cart</span></Link>
                        </>)}
                        {user.role === 'restaurant' && (<>
                          <Link href="/seller" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Store className="h-4 w-4" /></span><span className="font-medium">Seller Dashboard</span></Link>
                          <Link href="/seller/orders" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><ClipboardList className="h-4 w-4" /></span><span className="font-medium">Orders</span></Link>
                          <Link href="/seller/menu" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Settings className="h-4 w-4" /></span><span className="font-medium">Menu</span></Link>
                        </>)}
                        {user.role === 'delivery' && (<>
                          <Link href="/delivery" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Bike className="h-4 w-4" /></span><span className="font-medium">Delivery Panel</span></Link>
                          <Link href="/delivery" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><ClipboardList className="h-4 w-4" /></span><span className="font-medium">My Orders</span></Link>
                        </>)}
                        {user.role === 'admin' && (<>
                          <Link href="/admin" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Settings className="h-4 w-4" /></span><span className="font-medium">Admin Panel</span></Link>
                          <Link href="/admin/users" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Users2 className="h-4 w-4" /></span><span className="font-medium">Users</span></Link>
                          <Link href="/admin/restaurants" className="group flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"><span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Store className="h-4 w-4" /></span><span className="font-medium">Restaurants</span></Link>
                        </>)}
                      </div>
                      <div className="border-t border-orange-100/70 bg-white/70">
                        <button onClick={handleLogout} className="group flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                          <span className="h-7 w-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition"><LogOut className="h-4 w-4" /></span>Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary" asChild><Link href="/login">Login</Link></Button>
                  <Button className="bg-primary hover:opacity-90" asChild><Link href="/register">Sign Up</Link></Button>
                </div>
              )}
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-all">{showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
            </div>
          </div>
        </div>
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-around py-4 border-b border-gray-200">
                <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center space-y-1 text-gray-600 hover:text-primary"><Search className="h-6 w-6" /><span className="text-xs font-medium">Search</span></button>
                {user && <div className="flex flex-col items-center space-y-1"><NotificationSystem /><span className="text-xs font-medium text-gray-600">Notifications</span></div>}
                {user && user.role === 'customer' && (
                  <Link href="/cart" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-primary" onClick={() => setShowMobileMenu(false)}>
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6" />
                      {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">{cartCount}</span>}
                    </div>
                    <span className="text-xs font-medium">Cart</span>
                  </Link>
                )}
              </div>
              <Link href="/" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>Home</Link>
              <Link href="/restaurants" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>Restaurants</Link>
              {user && <Link href="/orders" className="block py-2 text-gray-700 hover:text-primary font-medium" onClick={() => setShowMobileMenu(false)}>My Orders</Link>}
              {!user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link href="/login" className="block w-full text-center py-2 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10" onClick={() => setShowMobileMenu(false)}>Login</Link>
                  <Link href="/register" className="block w-full text-center bg-primary text-white py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium" onClick={() => setShowMobileMenu(false)}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 sm:px-8 bg-neutral-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-orange-200/50 dark:border-neutral-700/60 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.25)] animate-in fade-in-0 slide-in-from-top-4">
            {/* Header / Input */}
            <div className="px-5 pt-5 pb-4" role="combobox" aria-haspopup="listbox" aria-expanded={suggestions.length>0} aria-owns="search-suggestion-list">
              <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 dark:text-orange-400 z-10 pointer-events-none drop-shadow-sm" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search restaurants, cuisines or dishes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min((suggestions.length||recentSearches.length)-1, i+1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(0, i-1)) }
                    if (e.key === 'Enter') {
                      if (highlightedIndex >=0) {
                        if (suggestions.length) {
                          const item = suggestions[highlightedIndex]
                          if (item) { executeSearch(item.name, item.type); return }
                        } else {
                          const term = recentSearches[highlightedIndex]
                          if (term) { executeSearch(term, 'recent'); return }
                        }
                      }
                      if (searchQuery.trim()) executeSearch(searchQuery)
                    }
                  }}
                  autoFocus
                  className="h-12 pl-12 pr-12 text-sm rounded-xl border-orange-200/60 focus-visible:ring-orange-500 bg-white/70 dark:bg-neutral-800/60 backdrop-blur placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
                {!!searchQuery && !loadingSuggestions && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); setHighlightedIndex(-1); searchInputRef.current?.focus() }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    aria-label="Clear search"
                  ><X className="h-4 w-4" /></button>
                )}
                {loadingSuggestions && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 animate-spin" />}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400">
                <span className="hidden sm:inline">Enter to search • Esc to close • ↑ ↓ navigate</span>
                <span className="sm:hidden">Esc to close</span>
                {suggestions.length>0 && <span className="hidden md:inline text-orange-600">{suggestions.length} result{suggestions.length>1?'s':''}</span>}
              </div>
              <div className="sr-only" aria-live="polite">{suggestions.length} suggestions available</div>
            </div>
            {/* Content */}
            <div className="px-5 pb-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-orange-300/30 dark:scrollbar-thumb-neutral-700/50">
              {/* Results / Recent list */}
              {(searchQuery.trim().length>=2 ? (suggestions.length>0 || loadingSuggestions) : recentSearches.length>0) ? (
                <ul id="search-suggestion-list" role="listbox" className="space-y-1 mb-5">
                  {searchQuery.trim().length < 2 && recentSearches.length>0 && (
                    <li className="px-2 pt-2 text-[11px] font-semibold tracking-wide uppercase text-gray-500 dark:text-neutral-400">Recent</li>
                  )}
                  {searchQuery.trim().length < 2 && recentSearches.map((term, idx) => (
                    <li key={term+idx} role="option" aria-selected={highlightedIndex===idx} onMouseEnter={() => setHighlightedIndex(idx)} onMouseDown={e => { e.preventDefault(); executeSearch(term, 'recent') }}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors border border-transparent ${highlightedIndex===idx? 'bg-orange-50 dark:bg-neutral-700/40 border-orange-200/70' : 'hover:bg-orange-50/70 dark:hover:bg-neutral-700/30'}`}> 
                      <span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><History className="h-4 w-4" /></span>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="flex-1 truncate text-gray-700 dark:text-neutral-200">{term}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Recent</span>
                      </div>
                    </li>
                  ))}
                  {searchQuery.trim().length>=2 && suggestions.length>0 && (
                    <li className="px-2 pt-2 text-[11px] font-semibold tracking-wide uppercase text-gray-500 dark:text-neutral-400 sticky top-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-t">Results</li>
                  )}
                  {searchQuery.trim().length>=2 && suggestions.map((s, idx) => (
                    <li key={s.type+s.id} role="option" aria-selected={highlightedIndex===idx} onMouseEnter={() => setHighlightedIndex(idx)} onMouseDown={e => { e.preventDefault(); executeSearch(s.name, s.type) }}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors border border-transparent ${highlightedIndex===idx? 'bg-orange-50 dark:bg-neutral-700/40 border-orange-200/70' : 'hover:bg-orange-50/70 dark:hover:bg-neutral-700/30'}`}> 
                      <span className="h-7 w-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">{s.type==='restaurant'? <Store className="h-4 w-4" /> : <Search className="h-4 w-4" />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 dark:text-neutral-100 font-medium truncate">{s.name}</p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{s.type}</p>
                      </div>
                    </li>
                  ))}
                  {loadingSuggestions && (
                    <li className="flex items-center gap-2 px-3 py-3 text-gray-500 dark:text-neutral-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</li>
                  )}
                  {!loadingSuggestions && searchQuery.trim().length>=2 && suggestions.length===0 && (
                    <li className="px-3 py-6 text-center text-sm text-gray-500 dark:text-neutral-400 border rounded-lg border-dashed">No matches. Try refining your search.</li>
                  )}
                </ul>
              ) : null}

              {/* Quick Picks */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
          {['Pizza','Burger','Healthy','Chinese','Desserts','Biryani','Pasta','Salad'].map(term => (
            <button key={term} onClick={() => executeSearch(term, 'quick')} className="px-3 py-1.5 rounded-full bg-orange-100/70 text-orange-700 hover:bg-orange-200/70 text-[12px] font-medium transition dark:bg-neutral-700/60 dark:text-neutral-200 dark:hover:bg-neutral-600">
                      {term}
                    </button>
                  ))}
                </div>
                {recentSearches.length>0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-100/60 dark:border-neutral-700/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400 mr-2">Recent:</span>
                    {recentSearches.slice(0,6).map(r => (
                      <button key={r} onClick={() => executeSearch(r, 'recent')} className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-200">{r}</button>
                    ))}
                    <button onClick={() => { setRecentSearches([]); try { localStorage.removeItem('recentSearches') } catch {} }} className="ml-auto text-[10px] uppercase tracking-wide text-orange-600 hover:underline">Clear</button>
                  </div>
                )}
              </div>
            </div>
            {/* Footer shortcuts */}
            <div className="px-5 py-3 border-t border-orange-100/70 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-900/70 rounded-b-2xl flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium">/</span>
                open
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium">Esc</span>
                close
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium">↑ ↓</span>
                navigate
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium">Enter</span>
                select
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium">Ctrl+K</span>
                open
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="ml-auto hidden md:inline-flex text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition" aria-label="Close overlay">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}