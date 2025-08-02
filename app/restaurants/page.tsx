'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Clock, DollarSign } from 'lucide-react'

interface Restaurant {
  _id: string
  name: string
  cuisine: string[]
  rating: number
  deliveryTime: string
  deliveryFee: number
  image: string
  description: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants')
      const data = await response.json()
      setRestaurants(data.restaurants || [])
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading restaurants...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">All Restaurants</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <div key={restaurant._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <div className="relative h-48">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 mb-2">{restaurant.description}</p>
                <p className="text-sm text-gray-500 mb-4">{restaurant.cuisine.join(', ')}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{restaurant.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>${restaurant.deliveryFee}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants found.</p>
          </div>
        )}
      </div>
    </div>
  )
}