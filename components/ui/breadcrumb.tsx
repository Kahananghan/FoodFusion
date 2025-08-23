import * as React from 'react'
import { cn } from '@/lib/utils'

export const Breadcrumb = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <nav aria-label="breadcrumb" className={cn('flex', className)} {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
  <ol className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)} {...props} />
)

export const BreadcrumbItem = ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn('inline-flex items-center gap-1', className)} {...props} />
)

export const BreadcrumbLink = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a className={cn('transition-colors hover:text-foreground text-foreground/80', className)} {...props} />
)

export const BreadcrumbPage = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span aria-current="page" className={cn('font-medium text-foreground', className)} {...props} />
)

export const BreadcrumbSeparator = ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span role="presentation" className={cn('px-1 text-muted-foreground', className)} {...props}>
    {children || '/'}
  </span>
)