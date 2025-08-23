declare module '@radix-ui/react-slot' {
  import * as React from 'react'
  export interface SlotProps extends React.HTMLAttributes<HTMLElement> { children?: React.ReactNode }
  export const Slot: React.FC<SlotProps>
  export default Slot
}

declare module 'class-variance-authority' {
  export type VariantProps<T> = any
  export function cva(base?: string, config?: any): any
declare module '@radix-ui/react-dropdown-menu' {}
declare module '@radix-ui/react-avatar' {}
}