import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/utils'

const ToggleGroup = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('inline-flex items-center rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0.5 shadow-sm', className)}
    {...props}
  />
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow text-xs font-medium h-7 min-w-8 inline-flex items-center justify-center rounded-md px-2 transition-colors hover:bg-orange-50 dark:hover:bg-gray-800 dark:data-[state=on]:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60',
      className
    )}
    {...props}
  />
))
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
