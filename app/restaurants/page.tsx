"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Search, RefreshCcw } from 'lucide-react'
import Loader from '@/components/Loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

  const searchParams = useSearchParams()

  // Initialize filters from URL search params on mount and whenever params change
  useEffect(() => {
    const initialCity = searchParams?.get('city') || ''
    const initialCuisine = searchParams?.get('cuisine') || ''
    const initialSearch = searchParams?.get('search') || ''
    setFilters({ city: initialCity, cuisine: initialCuisine, search: initialSearch })
    setSearchInput(initialSearch)
    // fetch supporting data and restaurants
    fetchCities()
    fetchCuisines()
    // fetchRestaurants will be called by the filters effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
    return <Loader fullscreen message="Exploring tasty places" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute w-60 h-60 bg-[#ff6b35]/15 rounded-full blur-3xl top-[-4rem] left-[-3rem] animate-float" style={{ animationDuration: '11s' }} />
        <div className="absolute w-72 h-72 bg-[#ff6b35]/10 rounded-full blur-3xl bottom-[-5rem] right-[-2rem] animate-float" style={{ animationDelay: '2.5s', animationDuration: '13s' }} />
        <div className="absolute w-40 h-40 bg-[#ff6b35]/20 rounded-full blur-2xl top-1/3 left-[55%] animate-float" style={{ animationDelay: '4s', animationDuration: '9s' }} />
      </div>
      {/* Hero / Filters */}
      <div className="pt-14 pb-10 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] to-amber-400 drop-shadow-sm">Discover Great Restaurants</h1>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">Browse curated places and filter by city, cuisine, or name to find your next meal.</p>
          </div>
          <Card className="border border-orange-100 shadow-sm bg-white dark:bg-neutral-900">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <select
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                      <option value="">All Cities</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Cuisine */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Cuisine</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                    value={filters.cuisine}
                    onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                  >
                    <option value="">All Cuisines</option>
                    {cuisines.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
                {/* Search */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <Input
                      placeholder="Restaurant name..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6 justify-between">
                <div className="text-xs text-neutral-500">Showing <span className="font-medium text-neutral-700">{restaurants.length}</span> result{restaurants.length !== 1 && 's'}</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-9"
                    onClick={() => { fetchRestaurants() }}
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs h-9"
                    onClick={() => { setFilters({ city: '', cuisine: '', search: '' }); setSearchInput('') }}
                    disabled={!filters.city && !filters.cuisine && !filters.search}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

  <Separator className="bg-orange-100 dark:bg-orange-300/20" />

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 pb-16 pt-10">
        {restaurants.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <div className="text-5xl">🍽️</div>
              <CardTitle className="text-xl">No restaurants found</CardTitle>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">Try adjusting filters or search terms. You can also explore all results by clearing filters.</p>
              <Button
                onClick={() => { setFilters({ city: '', cuisine: '', search: '' }); setSearchInput('') }}
              >Clear Filters</Button>
            </CardContent>
          </Card>
        )}

        {restaurants.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map(r => (
              <Link key={r.id} href={`/restaurants/${r.id}`} className="group">
                <Card className="overflow-hidden h-full flex flex-col border-orange-100 hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={r.featured_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=360&fit=crop'}
                      alt={r.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {/* <Badge variant="secondary" className="flex items-center gap-1 bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border border-orange-100 dark:border-neutral-700">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-medium text-xs">{r.user_rating.aggregate_rating}</span>
                      </Badge> */}
                      {r.has_online_delivery === 1 && (
                        <Badge className="bg-green-500 text-white border-transparent">Delivery</Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-3 pt-5 px-5 space-y-2">
                    <CardTitle className="text-lg font-semibold leading-tight text-neutral-800 group-hover:text-orange-600 transition-colors">
                      {r.name}
                    </CardTitle>
                    <p className="text-xs font-medium text-orange-600/90 tracking-wide">{r.cuisines}</p>
                  </CardHeader>
                  <CardContent className="pt-0 px-5 pb-5 mt-auto space-y-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{r.location.city}, {r.location.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Avg cost (2)</span>
                      <span className="font-medium text-neutral-700">{r.currency} {r.average_cost_for_two}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}