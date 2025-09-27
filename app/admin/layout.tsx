import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FoodFusion | Admin',
  description: 'Admin dashboard for managing restaurants, orders, users and stats.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="admin-panel min-h-screen">
      {children}
    </section>
  )
}
