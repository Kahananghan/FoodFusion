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
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [orders, setOrders] = useState<any[]>([])

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
    // Force fallback menu with both items
    const fallbackMenu = [
      {
        id: '1',
        name: 'Special Dish',
        description: 'House special with fresh ingredients',
        price: 350,
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
      },
      {
        id: '2',
        name: 'Gujarati Dish',
        description: 'Gujarati special with fresh ingredients',
        price: 250,
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
      }
    ]
    setMenuItems(fallbackMenu)
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

  const handleCheckout = async () => {
    if (getTotalItems() === 0) return
    
    setIsCheckingOut(true)
    try {
      // Prepare order data for database
      const orderData = {
        user: '507f1f77bcf86cd799439011', // Valid ObjectId format
        restaurant: '507f1f77bcf86cd799439012', // Valid ObjectId format  
        items: Array.isArray(menuItems) ? menuItems.filter(item => cart[item.id] > 0).map(item => ({
          menuItem: {
            name: item.name,
            price: item.price,
            image: item.image || ''
          },
          quantity: cart[item.id]
        })) : [],
        totalAmount: getTotalPrice() + 40,
        deliveryAddress: {
          street: '123 Main St',
          city: 'Mumbai', 
          state: 'Maharashtra',
          zipCode: '400001'
        },
        status: 'confirmed',
        deliveryFee: 40
      }
      
      // Save to database
      console.log('Sending order data:', orderData)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })
      
      let orderId = Date.now().toString()
      
      if (response.ok) {
        const result = await response.json()
        console.log('Order saved to database:', result)
        orderId = result.order._id
      } else {
        const errorData = await response.text()
        console.error('Database save failed:', response.status, errorData)
        throw new Error('Failed to save order')
      }
      
      setCart({})
      
      alert(`Order placed successfully! Order ID: ${orderId}`)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
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
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="font-semibold text-yellow-500 ">{restaurant.user_rating.aggregate_rating}</span>
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
                <h2 className="text-2xl font-bold mb-6 text-black">Menu</h2>
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
                        <h3 className="text-lg font-semibold text-black">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <p className="text-lg font-bold text-primary">₹{item.price}</p>
                      </div>
                      <div className="flex items-center">
                        {cart[item.id] > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-semibold text-primary min-w-[20px] text-center">{cart[item.id]}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                {getTotalItems() > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 mb-6">
                    <h3 className="text-xl font-bold mb-4">Cart ({getTotalItems()} items)</h3>
                    <div className="space-y-2 mb-4">
                      {Array.isArray(menuItems) && menuItems.filter(item => cart[item.id] > 0).map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name} x {cart[item.id]}</span>
                          <span>₹{item.price * cart[item.id]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg mb-2">
                        <span>Subtotal</span>
                        <span>₹{getTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Delivery Fee</span>
                        <span>₹40</span>
                      </div>
                      <div className="flex justify-between font-bold text-xl border-t pt-2">
                        <span>Total</span>
                        <span>₹{getTotalPrice() + 40}</span>
                      </div>
                      <a 
                        href="/cart"
                        className="w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-orange-600 transition-colors block text-center"
                      >
                        Go to Cart
                      </a>
                    </div>
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
