"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-2 overflow-hidden rounded-md border p-3 pr-5 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-[13px] leading-snug backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/70",
  {
    variants: {
      variant: {
  default: "bg-white/80 dark:bg-neutral-900/80 border-orange-100/60 dark:border-neutral-800 text-gray-800 dark:text-gray-100",
  success: "bg-gradient-to-br from-green-50/90 to-white dark:from-green-950/40 dark:to-neutral-900 border-green-200/70 dark:border-green-900 text-green-800 dark:text-green-100",
  error: "bg-gradient-to-br from-red-50/90 to-white dark:from-red-950/40 dark:to-neutral-900 border-red-200/70 dark:border-red-900 text-red-800 dark:text-red-100",
  warning: "bg-gradient-to-br from-amber-50/90 to-white dark:from-amber-950/40 dark:to-neutral-900 border-amber-200/70 dark:border-amber-900 text-amber-800 dark:text-amber-100",
  info: "bg-gradient-to-br from-sky-50/90 to-white dark:from-sky-950/40 dark:to-neutral-900 border-sky-200/70 dark:border-sky-900 text-sky-800 dark:text-sky-100"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof toastVariants> {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  duration?: number
  dismissible?: boolean
}

export interface ToastInternal extends Omit<ToastProps, "id"> {
  id: string
  createdAt: number
  open: boolean
}

const ToastContext = React.createContext<{
  toasts: ToastInternal[]
  push: (t: Omit<ToastInternal, "createdAt" | "open">) => string
  dismiss: (id?: string) => void
  remove: (id: string) => void
} | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>")
  return ctx
}

export function ToastProvider({ children, duration = 3500, max = 5 }: { children: React.ReactNode; duration?: number; max?: number }) {
  const [toasts, setToasts] = React.useState<ToastInternal[]>([])

  const push = React.useCallback((t: Omit<ToastInternal, "createdAt" | "open">) => {
    const id = t.id || Math.random().toString(36).slice(2)
    setToasts(curr => {
      const next: ToastInternal[] = [...curr, { ...t, id, createdAt: Date.now(), open: true }]
      // cap
      if (next.length > max) next.splice(0, next.length - max)
      return next
    })
    return id
  }, [max])

  const dismiss = React.useCallback((id?: string) => {
    setToasts(curr => curr.map(t => id && t.id !== id ? t : { ...t, open: false }))
  }, [])

  const remove = React.useCallback((id: string) => {
    setToasts(curr => curr.filter(t => t.id !== id))
  }, [])

  // auto dismiss
  React.useEffect(() => {
    const timers = toasts.map(t => {
      const d = t.duration ?? duration
      if (!t.open) return
      const remaining = d - (Date.now() - t.createdAt)
      if (remaining <= 0) return dismiss(t.id)
      return setTimeout(() => dismiss(t.id), remaining)
    })
    return () => { timers.forEach(t => t && clearTimeout(t)) }
  }, [toasts, duration, dismiss])

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, remove }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

export function toast(opts: Omit<ToastInternal, "createdAt" | "open"> | string) {
  // This utility is intended to be re-exported from a wrapper (see CustomToaster migration)
  throw new Error("toast() called outside of provider. Use wrapped helper or useToast().")
}

function ToastViewport() {
  const { toasts, remove, dismiss } = useToast()
  return (
    <div className="fixed top-5 right-5 z-50 flex w-80 max-w-[92vw] flex-col gap-3">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} onRemove={() => remove(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss, onRemove }: { toast: ToastInternal; onDismiss: () => void; onRemove: () => void }) {
  // remove after exit
  React.useEffect(() => {
    if (!toast.open) {
      const tm = setTimeout(onRemove, 160)
      return () => clearTimeout(tm)
    }
  }, [toast.open, onRemove])

  // live progress (remaining fraction of duration)
  const [progress, setProgress] = React.useState(1)
  React.useEffect(() => {
    if (!toast.open) return
    const d = toast.duration ?? 3500
    let frame: number
    const tick = () => {
      const elapsed = Date.now() - toast.createdAt
      const pct = 1 - Math.min(1, elapsed / d)
      setProgress(pct)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [toast.open, toast.createdAt, toast.duration])

  const accent = toast.variant === 'success'
    ? 'from-green-500 via-emerald-400 to-green-500'
    : toast.variant === 'error'
      ? 'from-red-500 via-rose-400 to-red-500'
      : toast.variant === 'warning'
        ? 'from-amber-500 via-yellow-400 to-amber-500'
        : toast.variant === 'info'
          ? 'from-sky-500 via-cyan-400 to-sky-500'
          : 'from-orange-500 via-amber-400 to-orange-500'

  return (
    <div
      role="status"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      data-open={toast.open}
      className={cn(
        toastVariants({ variant: toast.variant }),
        'transition-all duration-200 origin-top-right ring-1 ring-black/5 dark:ring-white/10',
        toast.open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-1'
      )}
    >
      {/* Accent bar */}
      <span className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', accent)} />
      <div className="flex flex-col gap-0.5 pr-1 pl-1">
        {toast.title && <div className="font-semibold leading-tight tracking-tight text-[13px] flex items-center gap-1">
          {toast.title}
          {toast.variant === 'success' && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
        </div>}
        {toast.description && <div className="text-[12px] leading-snug text-gray-600 dark:text-gray-300 font-normal">
          {toast.description}
        </div>}
        {toast.action && <div className="mt-1">{toast.action}</div>}
        <div className="relative mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-neutral-800">
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-100 ease-linear', accent)}
            style={{ width: (progress * 100).toFixed(2) + '%' }}
            aria-hidden="true"
          />
        </div>
      </div>
      <button
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
