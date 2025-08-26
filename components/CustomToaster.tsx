"use client";

import * as React from 'react'
import { CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'

// Helper API mirroring prior react-hot-toast usage
export const toast = {
  success: (description: React.ReactNode, opts?: any) => pushToast({ description, title: 'Success', variant: 'success', ...opts }),
  error: (description: React.ReactNode, opts?: any) => pushToast({ description, title: 'Error', variant: 'error', ...opts }),
  warning: (description: React.ReactNode, opts?: any) => pushToast({ description, title: 'Warning', variant: 'warning', ...opts }),
  info: (description: React.ReactNode, opts?: any) => pushToast({ description, title: 'Info', variant: 'info', ...opts }),
  loading: (description: React.ReactNode, opts?: any) => pushToast({ description, title: 'Loading', variant: 'info', action: <Loader2 className="h-4 w-4 animate-spin" />, duration: 60000, ...opts }),
}

let pushToast: (t: any) => string

// Bridge component to capture context function
function ToastBridge() {
  const { push } = useToast()
  React.useEffect(() => { pushToast = (t) => push({ id: t.id, title: t.title, description: (
    <span className="inline-flex items-start gap-2">{iconFor(t.variant)}<span className="flex-1">{t.description}</span></span>
  ), variant: t.variant, action: t.action, duration: t.duration }) }, [push])
  return null
}

function iconFor(variant?: string) {
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
  if (variant === 'error') return <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
  if (variant === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
  if (variant === 'info') return <Info className="h-4 w-4 text-sky-500 mt-0.5" />
  return null
}

export default function CustomToaster({ children }: { children?: React.ReactNode }) {
  return (
    <ToastProvider>
      <ToastBridge />
      {children}
    </ToastProvider>
  )
}

// Example usage (after migration):
// import { toast } from '@/components/CustomToaster'
// toast.success('Item added to cart')
// toast.error('Failed to place order')
// toast.info('Welcome back!')
