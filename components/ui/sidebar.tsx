import * as React from 'react'
import { cn } from '@/lib/utils'

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  setOpen: (v: boolean) => void
}
const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState<boolean>(true)

  // persist state
  React.useEffect(() => {
    const stored = window.localStorage.getItem('admin-sidebar-open')
    if (stored !== null) {
      setOpen(stored === 'true')
    }
  }, [])
  React.useEffect(() => {
    window.localStorage.setItem('admin-sidebar-open', String(open))
  }, [open])

  // auto collapse on small screens
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const listener = () => setOpen(!mq.matches) // collapse when small
    listener()
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  const toggle = () => setOpen(o => !o)
  return (
    <SidebarContext.Provider value={{ open, toggle, setOpen }}>
      <div
        className={cn(
          'flex w-full h-screen overflow-hidden text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-950',
          'transition-colors'
        )}
        style={{
          // expose width tokens for consumers if needed
          ['--sidebar-width-open' as any]: '16rem',
          ['--sidebar-width-closed' as any]: '4.25rem'
        }}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

export const Sidebar = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useSidebar()
  return (
    <aside
      data-state={open ? 'open' : 'collapsed'}
      aria-label="Main navigation"
      className={cn(
  'group/sidebar flex flex-col border-r border-gray-200 dark:border-gray-800 sticky top-0 h-screen overflow-hidden',
        'bg-white dark:bg-gray-900',
        'transition-all duration-300 ease-in-out',
        'w-[var(--sidebar-width-closed)] data-[state=open]:w-[var(--sidebar-width-open)]',
  // removed custom scrollbar styling for a cleaner static sidebar
        className
      )}
    >
  {/* subtle divider */}
  <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gray-200 dark:bg-gray-800" />
      {children}
    </aside>
  )
}

export const SidebarTrigger = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { toggle, open } = useSidebar()
  return (
    <button
      type="button"
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      onClick={toggle}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 transition',
        className
      )}
      {...props}
    >
      <span className="sr-only">Toggle sidebar</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('h-4 w-4 transition-transform duration-300 text-gray-600 dark:text-gray-300', open ? 'rotate-180' : 'rotate-0')}
      >
        <path d="M8 5l8 7-8 7" />
      </svg>
    </button>
  )
}

export const SidebarInset = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 flex flex-col h-screen overflow-hidden', className)}>{children}</div>
)