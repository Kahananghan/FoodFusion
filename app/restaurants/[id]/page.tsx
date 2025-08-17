'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, MapPin, Plus, Minus } from 'lucide-react'
import { addToCart as addToCartDB } from '@/utils/cart'
import toast from 'react-hot-toast'

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
    try {
      const response = await fetch(`/api/restaurants/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data)
      } else {
        // Fallback: try to find restaurant from all restaurants
        const allResponse = await fetch('/api/restaurants')
        if (allResponse.ok) {
          const allData = await allResponse.json()
          const foundRestaurant = allData.restaurants.find((r: any) => r.id === params.id)
          if (foundRestaurant) {
            setRestaurant(foundRestaurant)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error)
    }
  }

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/menu`)
      if (response.ok) {
        const data = await response.json()
        const formattedMenu = data.menuItems.map((item: any) => ({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
        }))
        setMenuItems(formattedMenu)
      } else {
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      setMenuItems([])
    }
    setLoading(false)
  }

  const addToCart = async (itemId: string) => {
    const item = menuItems.find(m => m.id === itemId)
    if (!item) return

    try {
      const success = await addToCartDB({
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        restaurant: restaurant?.name || 'Restaurant'
      })

      if (success) {
        setCart(prev => ({
          ...prev,
          [itemId]: (prev[itemId] || 0) + 1
        }))
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error: any) {
      if (error.message?.includes('Authentication required') || error.status === 401) {
        toast.error('Please login to add items to cart')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    }
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCount = Math.max((prev[itemId] || 0) - 1, 0)
      const newCart = { ...prev }
      if (newCount === 0) {
        delete newCart[itemId]
      } else {
        newCart[itemId] = newCount
      }
      return newCart
    })
  }


  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0)
  }

  const getTotalPrice = () => {
    if (!Array.isArray(menuItems)) return 0
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {restaurant && (
        <>
          <div className="relative h-80">
            <Image
              src={restaurant.featured_image}
              alt={restaurant.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{restaurant.name}</h1>
              <p className="text-xl opacity-90 drop-shadow">{restaurant.cuisines}</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-yellow-50 p-2 rounded-full mr-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                    <span className="font-bold text-xl text-yellow-600">{restaurant.user_rating.aggregate_rating}</span>
                    <span className="text-gray-600 ml-3 text-lg">{restaurant.user_rating.rating_text}</span>
                  </div>
                  <p className="text-gray-600 flex items-center text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    {restaurant.location.locality}, {restaurant.location.city}
                  </p>
                </div>
                <div className="text-right bg-primary/10 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{restaurant.currency}{restaurant.average_cost_for_two}</p>
                  <p className="text-gray-600">for two</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">Menu</h2>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-primary to-transparent rounded"></div>
                </div>
                <div className="space-y-6">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex border border-gray-100">
                      <div className="relative flex items-center justify-center w-[200px] h-[150px]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={200}
                          height={100}
                          className="rounded-xl object-cover shadow-md aspect-[2/1] w-[200px] h-[150px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                      </div>
                      <div className="ml-6 flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                        <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                          <div className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Popular</div>
                        </div>
                      </div>
                      <div className="flex items-center ml-4">
                        {cart[item.id] > 0 ? (
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-bold text-primary text-lg min-w-[30px] text-center">{cart[item.id]}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <button
                              onClick={() => addToCart(item.id)}
                              className="px-6 py-3 bg-gradient-to-r from-primary to-orange-500 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              Add to Cart
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                {getTotalItems() > 0 && (
                  <div className="bg-white rounded-xl shadow-xl p-6 sticky top-4 border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Cart ({getTotalItems()} items)</h3>
                    </div>
                    <div className="space-y-3 mb-6">
                      {Array.isArray(menuItems) && menuItems.filter(item => cart[item.id] > 0).map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-700">{item.name} x {cart[item.id]}</span>
                          <span className="font-bold text-primary">₹{item.price * cart[item.id]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">₹{getTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-semibold">₹40</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{getTotalPrice() + 40}</span>
                      </div>
                    </div>
                    <a 
                      href="/cart"
                      className="w-full bg-gradient-to-r from-primary to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 block text-center"
                    >
                      Proceed to Cart →
                    </a>
                  </div>
                )}
              </div>
            </div>
            </div>
          </>
        )}
    </div>
  )
}
