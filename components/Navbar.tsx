'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            FoodDelivery
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary">Home</Link>
            <Link href="/restaurants" className="text-gray-700 hover:text-primary">Restaurants</Link>
            <Link href="/orders" className="text-gray-700 hover:text-primary">Orders</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Search className="h-6 w-6 text-gray-600 cursor-pointer" />
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>
            <Link href="/profile">
              <User className="h-6 w-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}