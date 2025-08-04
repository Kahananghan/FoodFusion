'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, MapPin, Plus, Minus } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
}

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
    locality: string
    city: string
  }
  featured_image: string
  average_cost_for_two: number
  currency: string
}

export default function RestaurantPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurant()
    fetchMenu()
  }, [params.id])

  const fetchRestaurant = async () => {
    console.log('Fetching restaurant with ID:', params.id)
    try {
      const response = await fetch(`/api/restaurants/${params.id}`)
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Restaurant data:', data)
        setRestaurant(data)
      } else {
        console.log('API failed, using fallback')
        setRestaurant({
          id: params.id,
          name: 'Restaurant Name',
          cuisines: 'Multi Cuisine',
          user_rating: { aggregate_rating: '4.5', rating_text: 'Very Good' },
          location: { address: 'Address', locality: 'Locality', city: 'City' },
          featured_image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400&fit=crop',
          average_cost_for_two: 1500,
          currency: '₹'
        })
      }
    } catch (error) {
      console.log('Fetch error:', error)
      setRestaurant({
        id: params.id,
        name: 'Restaurant Name',
        cuisines: 'Multi Cuisine',
        user_rating: { aggregate_rating: '4.5', rating_text: 'Very Good' },
        location: { address: 'Address', locality: 'Locality', city: 'City' },
        featured_image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400&fit=crop',
        average_cost_for_two: 1500,
        currency: '₹'
      })
    }
  }

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/menu`)
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      } else {
        // Fallback to mock menu
        setMenuItems([
          {
            id: '1',
            name: 'Special Dish',
            description: 'House special with fresh ingredients',
            price: 350,
            image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
          }
        ])
      }
    } catch (error) {
      // Fallback to mock menu
      setMenuItems([
        {
          id: '1',
          name: 'Special Dish',
          description: 'House special with fresh ingredients',
          price: 350,
          image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
        }
      ])
    }
    setLoading(false)
  }

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 0) - 1, 0)
    }))
  }

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0)
  }

  const getTotalPrice = () => {
    return menuItems.reduce((total, item) => {
      return total + (item.price * (cart[item.id] || 0))
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading restaurant...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {restaurant && (
        <>
          <div className="relative h-64">
            <Image
              src={restaurant.featured_image}
              alt={restaurant.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold">{restaurant.name}</h1>
              <p className="text-lg">{restaurant.cuisines}</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 text-yellow-400 mr-1" />
                    <span className="font-semibold">{restaurant.user_rating.aggregate_rating}</span>
                    <span className="text-gray-600 ml-2">{restaurant.user_rating.rating_text}</span>
                  </div>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {restaurant.location.locality}, {restaurant.location.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{restaurant.currency}{restaurant.average_cost_for_two} for two</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6">Menu</h2>
                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={120}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <p className="text-lg font-bold text-primary">₹{item.price}</p>
                      </div>
                      <div className="flex items-center">
                        {cart[item.id] > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-semibold">{cart[item.id]}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {getTotalItems() > 0 && (
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <h3 className="text-xl font-bold mb-4">Cart ({getTotalItems()} items)</h3>
                    <div className="space-y-2 mb-4">
                      {menuItems.filter(item => cart[item.id] > 0).map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name} x {cart[item.id]}</span>
                          <span>₹{item.price * cart[item.id]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{getTotalPrice()}</span>
                      </div>
                      <button className="w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-orange-600">
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </>
        )}
    </div>
  )
}
