'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, MapPin, Search } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  cuisines: string
  user_rating: {
    aggregate_rating: string
    rating_text: string
  }
  location: {
    address: string
    city: string
    state: string
  }
  featured_image: string
  average_cost_for_two: number
  currency: string
  has_online_delivery: number
}



export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<string[]>([])
  const [cuisines, setCuisines] = useState<string[]>([])
  const [filters, setFilters] = useState({
    city: '',
    cuisine: '',
    search: ''
  })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchCities()
    fetchCuisines()
    fetchRestaurants()
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
      const response = await fetch('/api/restaurants/cities')
      const data = await response.json()
      setCities(data.cities || [])
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const fetchCuisines = async () => {
    try {
      const response = await fetch('/api/restaurants/cuisines')
      const data = await response.json()
      setCuisines(data.cuisines || [])
    } catch (error) {
      console.error('Error fetching cuisines:', error)
    }
  }

  const fetchRestaurants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.city) params.append('city', filters.city)
      if (filters.cuisine) params.append('cuisine', filters.cuisine)
      if (filters.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/restaurants?${params}`)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Restaurants</h1>
          <p className="text-xl opacity-90 mb-8">Find the best food experiences near you</p>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                <select
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-gray-50 font-medium text-gray-700"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                >
                  <option value="">🏙️ All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <select
                className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 font-medium text-gray-700"
                value={filters.cuisine}
                onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
              >
                <option value="">🍽️ All Cuisines</option>
                {cuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 font-medium text-gray-700 placeholder-gray-500"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Restaurants</h2>
          <span className="text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
            {restaurants.length} restaurants found
          </span>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-100">
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={restaurant.featured_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop'}
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-semibold text-gray-800">{restaurant.user_rating.aggregate_rating}</span>
                    </div>
                  </div>
                  {restaurant.has_online_delivery === 1 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        🚚 Delivery
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 font-medium">{restaurant.cuisines}</p>
                  
                  <div className="flex items-center text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{restaurant.location.city}, {restaurant.location.state}</span>
                  </div>
                  
                  
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {restaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search filters or explore different areas</p>
            <button 
              onClick={() => {
                setFilters({ city: '', cuisine: '', search: '' })
                setSearchInput('')
              }}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}