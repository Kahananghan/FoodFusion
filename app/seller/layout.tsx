import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FoodFusion | Seller',
  description: 'Seller dashboard to manage menu, orders and restaurant settings.',
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="seller-panel min-h-screen">
      {children}
    </section>
  )
}
