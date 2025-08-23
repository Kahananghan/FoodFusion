"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'bg-orange-600 text-white border-transparent',
        variant === 'secondary' && 'bg-gray-100 text-gray-800 border-transparent dark:bg-gray-800 dark:text-gray-200',
        variant === 'destructive' && 'bg-red-500 text-white border-transparent',
        variant === 'outline' && 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'
