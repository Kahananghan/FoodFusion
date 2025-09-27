import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FoodFusion | Delivery',
  description: 'Delivery partner dashboard: view available orders, update delivery status and manage assigned orders.',
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="delivery-panel min-h-screen">
      {children}
    </section>
  )
}
