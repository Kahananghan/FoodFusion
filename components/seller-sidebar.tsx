"use client"
import { useSidebar } from '@/components/ui/sidebar'
import { BarChart3, Store, ShoppingBag, TrendingUp, UtensilsCrossed, LogOut, BadgeCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'menu', label: 'Menu', icon: Store },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'reports', label: 'Reports', icon: TrendingUp }
]

interface SellerSidebarProps {
  active: string
  onChange: (id: string) => void
  user?: { name: string; email?: string; avatar?: string; role?: string; createdAt?: string } | null
  onLogout?: () => void
}

export const SellerSidebar = ({ active, onChange, user, onLogout }: SellerSidebarProps) => {
  const { open } = useSidebar()
  const [showAccount, setShowAccount] = React.useState(false)

  React.useEffect(() => {
    if (!showAccount) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAccount(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showAccount])
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 h-14 px-3 border-b bg-gradient-to-r from-green-600 via-green-500/90 to-green-400 text-white shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 font-bold text-sm backdrop-blur">FF</div>
        {open && (
          <div className="flex flex-col justify-between">
            <span className="font-bold tracking-wide text-lg">FoodFusion</span>
            <span className="text-sm text-gray-100">Seller</span>
          </div>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-500/70 dark:text-gray-400 uppercase">Dashboard</div>
        {navItems.map(item => {
          const Icon = item.icon
            const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'group relative w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-600 text-white shadow ring-1 ring-green-300/50'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-green-600 group-hover:text-green-700 dark:group-hover:text-green-400')} />
              {open && <span className="truncate">{item.label}</span>}
              {!open && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t bg-white/70 dark:bg-gray-900/60 p-2 space-y-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-2 py-2 text-left transition group hover:bg-green-50 dark:hover:bg-gray-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60',
                  open ? 'justify-start' : 'justify-center'
                )}
              >
                <Avatar className={cn('h-9 w-9 rounded-lg ring-2 ring-green-300/60 dark:ring-green-800 shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white')}> 
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : (
                    <AvatarFallback className="rounded-lg from-green-500 to-green-600 bg-gradient-to-br text-white font-semibold">
                      {user.name?.[0] || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                {open && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate flex items-center gap-1">
                      {user.name}
                    </p>
                    {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </div>
                )}
                {open && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="h-4 w-4 opacity-60 group-data-[state=open]:rotate-180 transition"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={open ? 'right' : 'right'} align="end" className="min-w-60 border border-green-100 dark:border-green-800/40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl">
              <DropdownMenuLabel className="p-0">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-10 w-10 rounded-lg ring-2 ring-green-300/70 dark:ring-green-700 bg-gradient-to-br from-green-500 to-green-600 text-white">
                    {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : <AvatarFallback className="rounded-lg from-green-500 to-green-600 bg-gradient-to-br text-white font-semibold">{user.name?.slice(0,2) || 'US'}</AvatarFallback>}
                  </Avatar>
                  <div className="text-sm leading-tight">
                    <p className="font-medium truncate max-w-[150px] text-gray-700">{user.name}</p>
                    {user.email && <p className="text-xs truncate max-w-[150px] text-gray-600">{user.email}</p>}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-green-100 dark:bg-green-800/40" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2  hover:text-green-800 focus:text-green-800 dark:text-green-300 dark:hover:text-green-200 hover:bg-green-50 focus:bg-green-50 dark:hover:bg-green-900/30 dark:focus:bg-green-900/30 transition-colors" onClick={(e)=>{e.preventDefault(); setShowAccount(true)}}>
                  <BadgeCheck className="h-4 w-4 " />
                  <span className="font-medium">Account</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-green-100 dark:bg-green-800/40" />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/30">
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className={cn('flex pt-1', open ? 'justify-between' : 'justify-center')}>
          {open && <span className="self-center text-[11px] text-muted-foreground">© {new Date().getFullYear()} FoodFusion</span>}
        </div>
      </div>
      {showAccount && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0" onClick={() => setShowAccount(false)} />
          <div className="relative w-full max-w-sm mx-auto rounded-lg border bg-white dark:bg-gray-900 shadow-lg p-5 animate-in fade-in-0 zoom-in-95">
            <button
              onClick={() => setShowAccount(false)}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              aria-label="Close account details"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-14 w-14 rounded-lg ring-2 ring-green-300/60 dark:ring-green-800 bg-gradient-to-br from-green-500 to-green-600 text-white">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : <AvatarFallback className="rounded-lg text-base from-green-500 to-green-600 bg-gradient-to-br text-white font-semibold">{user.name?.slice(0,2) || 'US'}</AvatarFallback>}
              </Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight truncate">{user.name}</p>
                {user.email && <p className="text-sm text-muted-foreground truncate">{user.email}</p>}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {user.role && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" className="hover:bg-green-600" size="sm" onClick={() => setShowAccount(false)}>Close</Button>
              {onLogout && (
                <Button variant="destructive" size="sm" onClick={() => { setShowAccount(false); onLogout() }}>
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
