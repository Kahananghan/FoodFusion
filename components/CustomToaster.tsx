"use client";

import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react'

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={14}
      containerClassName="!pointer-events-none"
      containerStyle={{ top: 20, right: 18 }}
      toastOptions={{
        duration: 3500,
        className: `group relative overflow-hidden rounded-xl bg-white/90 dark:bg-neutral-900/85 backdrop-blur-xl
          ring-1 ring-orange-100/70 dark:ring-neutral-700/60 shadow-[0_6px_32px_-6px_rgba(0,0,0,0.35)] px-5 py-4
          flex items-start gap-4 text-sm font-medium text-gray-800 dark:text-gray-100 will-change-transform
          before:absolute before:left-0 before:top-0 before:h-full before:w-[6px] before:bg-gradient-to-b before:from-primary before:via-orange-400 before:to-primary before:animate-accentPulse before:rounded-tr-lg before:rounded-br-lg
          after:absolute after:inset-px after:rounded-[inherit] after:pointer-events-none after:border after:border-white/30 dark:after:border-white/5`,
        style: { boxShadow: '0 8px 30px -8px rgba(0,0,0,0.35)' },
        // type overrides
        success: {
          duration: 3500,
          className: 'success-toast'
        },
        error: {
          duration: 3500,
          className: 'error-toast'
        },
        loading: {
          className: 'loading-toast'
        }
      }}
    >
      {(t) => (
        <div
          className={`relative pointer-events-auto ${t.visible ? 'toast-enter' : 'toast-exit'} transition-all max-w-sm min-w-[270px]`}
          role="status"
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
        >  
          <ToastBar toast={t} style={{ animationDuration: '300ms' }}>
            {({ icon, message }) => (
              <div className="flex w-full items-start gap-4 pr-1">
                <div className="shrink-0 pt-0.5">
                  {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-sm" />}
                  {t.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 drop-shadow-sm" />}
                  {t.type === 'loading' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                  {t.type === 'blank' && <Info className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 leading-snug text-[0.875rem] font-medium pr-2">
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    aria-label="Dismiss notification"
                    onClick={() => toast.dismiss(t.id)}
                    className="opacity-60 hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden">
                  <div
                    className={`h-full animate-progress origin-left ${
                      t.type === 'success' ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500' :
                      t.type === 'error' ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-500' :
                      t.type === 'loading' ? 'bg-gradient-to-r from-primary via-orange-400 to-primary' :
                      'bg-gradient-to-r from-primary via-orange-500 to-primary'
                    }`}
                    style={{ animationDuration: `${t.duration ?? 3500}ms` }}
                  />
                </div>
              </div>
            )}
          </ToastBar>
        </div>
      )}
    </Toaster>
  )
}

// Usage examples:
// toast.success('Item added to cart')
// toast.error('Failed to place order')
// toast.loading('Processing payment...')
// toast.custom(t => (
//   <div className={`animate-in ${!t.visible && 'animate-out'} rounded-lg bg-white px-5 py-4 shadow`}>Custom Content</div>
// ))
