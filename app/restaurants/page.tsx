'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, MapPin, Search } from 'lucide-react'

interface ZomatoRestaurant {
  id: string
  name: string
  cuisines: string
  user_rating: {
    aggregate_rating: string
    rating_text: string
  }
  location: {
    address: string
    locality: string
    city: string
  }
  featured_image: string
  average_cost_for_two: number
  currency: string
  has_online_delivery: number
}

interface ZomatoCity {
  id: number
  name: string
  state_name: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<ZomatoRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<ZomatoCity[]>([])
  const [filters, setFilters] = useState({
    cityId: '',
    cuisine: '',
    search: ''
  })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [filters])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }))
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/zomato/cities?q=India')
      const data = await response.json()
      setCities(data.cities || [])
      if (data.cities?.length > 0) {
        setFilters(prev => ({ ...prev, cityId: data.cities[0].id.toString() }))
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const fetchRestaurants = async () => {
    if (!filters.cityId) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('city_id', filters.cityId)
      if (filters.search) params.append('q', filters.search)
      
      const response = await fetch(`/api/zomato/restaurants?${params}`)
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
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                value={filters.cityId}
                onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}, {city.state_name}</option>
                ))}
              </select>
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filters.cuisine}
              onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            >
              <option value="">All Cuisines</option>
              <option value="Indian">Indian</option>
              <option value="South Indian">South Indian</option>
              <option value="North Indian">North Indian</option>
              <option value="Mughlai">Mughlai</option>
              <option value="Hyderabadi">Hyderabadi</option>
              <option value="Continental">Continental</option>
              <option value="Chinese">Chinese</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search restaurants"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <div className="relative h-48">
                <Image
                  src={restaurant.featured_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop'}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{restaurant.cuisines}</p>
                <p className="text-xs text-gray-400 mb-4 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {restaurant.location.locality}, {restaurant.location.city}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{restaurant.user_rating.aggregate_rating}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">{restaurant.currency}</span>
                    <span>{restaurant.average_cost_for_two} for two</span>
                  </div>
                  {restaurant.has_online_delivery === 1 && (
                    <span className="text-green-600 text-xs">Delivery</span>
                  )}
                </div>
              </div>
              </div>
            </Link>
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