import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CustomToaster from '@/components/CustomToaster'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FoodFusion - Order Your Favorite Food',
  description: 'Fast and reliable food delivery service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <CustomToaster />
        </AuthProvider>
      </body>
    </html>
  )
}