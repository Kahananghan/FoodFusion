import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FoodFusion - Restaurants',
  description: 'Browse restaurants, view menus and place orders near you.',
}

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="restaurants-panel min-h-screen">
      {children}
    </section>
  )
}
