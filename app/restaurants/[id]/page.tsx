'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, MapPin, Plus, Minus } from 'lucide-react'
import { addToCart as addToCartDB } from '@/utils/cart'
import Loader from '@/components/Loader'
import { toast } from '@/components/CustomToaster'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  isVegetarian?: boolean
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
    city: string
    state: string
  }
  featured_image: string
  average_cost_for_two: number
  currency: string
}

export default function RestaurantPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [cartIds, setCartIds] = useState<{[key: string]: string}>({}) // map menuItemId -> cartItemId
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurant()
    fetchMenu()
  // Load existing cart from server to sync counts
  syncCartFromServer()
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
          image: item.image || 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop',
          isVegetarian: !!item.isVegetarian
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

  const syncCartFromServer = async () => {
    try {
  const res = await fetch('/api/cart', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success || !Array.isArray(data.cartItems)) return
      // Build mappings for items of this restaurant
      const newCart: {[k:string]: number} = {}
      const newIds: {[k:string]: string} = {}
      data.cartItems.forEach((ci: any) => {
        // Attempt to match by name + restaurant name (case-insensitive)
        const menuItem = menuItems.find(mi => mi.name === ci.name)
        if (menuItem) {
          newCart[menuItem.id] = ci.quantity || 0
          newIds[menuItem.id] = ci._id
        }
      })
      if (Object.keys(newCart).length) {
        setCart(prev => ({ ...prev, ...newCart }))
        setCartIds(prev => ({ ...prev, ...newIds }))
      }
    } catch (e) {
      // silent
    }
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
  // Refresh cart to capture server cart item ID
  setTimeout(() => syncCartFromServer(), 50)
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
    // NOTE: Avoid side-effects inside setState functional updater to prevent
    // double execution under React Strict Mode (which caused duplicate toasts).
    const current = cart[itemId] || 0
    const newCount = Math.max(current - 1, 0)

    setCart(prev => {
      const updated = { ...prev }
      if (newCount === 0) delete updated[itemId]; else updated[itemId] = newCount
      return updated
    })

    const cartItemId = cartIds[itemId]
    if (cartItemId) {
      if (newCount === 0) {
        fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE', credentials: 'include' })
          .then(res => {
            if (res.ok) {
              toast.success('Item removed from cart')
            } else {
              toast.error('Failed to remove item')
            }
            setCartIds(ids => { const copy = { ...ids }; delete copy[itemId]; return copy })
            window.dispatchEvent(new Event('cartUpdated'))
          })
      } else {
        fetch('/api/cart', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cartItemId, quantity: newCount })
        }).then(() => window.dispatchEvent(new Event('cartUpdated')))
      }
    } else {
      // If we don't have ID yet, attempt a background sync
      syncCartFromServer()
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

  const getDeliveryFee = () => {
    const subtotal = getTotalPrice()
    return subtotal >= 500 ? 0 : 40
  }

  if (loading) {
    return <Loader fullscreen message="Fetching delicious details" />
  }

  return (
    <div className="min-h-screen px-20 bg-gradient-to-br from-orange-50/60 via-white to-orange-100/80 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      {restaurant && (
        <>
          {/* Hero Section */}
          <div className="relative h-96 flex items-end justify-center">
            <Image
              src={restaurant.featured_image}
              alt={restaurant.name}
              fill
              className="object-cover h-full w-full rounded-3xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-3xl" />
            <Card className="absolute left-1/3 -translate-x-1/2 bottom-0 translate-y-1/2 w-[95vw] max-w-3xl shadow-2xl border-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
              <CardContent className="py-6 px-8 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-1">{restaurant.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="flex items-center gap-1 bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border border-orange-100 dark:border-neutral-700">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-sm">{restaurant.user_rating.aggregate_rating}</span>
                    </Badge>
                    <span className="text-gray-600 text-base">{restaurant.user_rating.rating_text}</span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-200 flex items-center text-base">
                    <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                    {restaurant.location.city}{restaurant.location.state ? `, ${restaurant.location.state}` : ''}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">{restaurant.cuisines}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-7xl mx-auto px-4 pt-32 pb-12 grid lg:grid-cols-3 gap-10">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">Menu</h2>
                <Separator className="ml-4 h-1 flex-1 bg-orange-500 dark:bg-orange-300/20" />
              </div>
              <div className="space-y-8">
                {menuItems.map((item) => (
                  <Card key={item.id} className="flex flex-col md:flex-row items-stretch bg-white/80 dark:bg-neutral-900/80 border-0 shadow-lg backdrop-blur-xl overflow-hidden">
                    <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">{item.name}</CardTitle>
                          {item.isVegetarian !== undefined && (
                            item.isVegetarian ? (
                              <Badge className="bg-green-100 text-green-700 border border-green-200">Veg</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border border-red-200">Non-Veg</Badge>
                            )
                          )}
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 mb-3 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                        {cart[item.id] > 0 ? (
                          <div className="flex items-center space-x-3 bg-orange-50/60 dark:bg-orange-900/30 rounded-xl p-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="w-9 h-9"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-orange-600 text-lg min-w-[30px] text-center">{cart[item.id]}</span>
                            <Button
                              type="button"
                              variant="success"
                              size="icon"
                              className="w-9 h-9 bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => addToCart(item.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                            onClick={() => addToCart(item.id)}
                          >
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1 mt-16">
              {getTotalItems() > 0 && (
                <Card className="shadow-2xl border-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl sticky top-24 rounded-2xl">
                  <CardContent className="p-0">
                    <div className="px-8 pt-8 pb-4">
                      <div className="flex items-center mb-4">
                        <div className="bg-orange-100 p-2 rounded-full mr-3">
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">Your Cart</CardTitle>
                      </div>
                      <Separator className="mb-4 bg-orange-100 dark:bg-orange-300/20" />
                      <div className="max-h-64 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar">
                        {Array.isArray(menuItems) && menuItems.filter(item => cart[item.id] > 0).map(item => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-orange-100 last:border-b-0">
                            <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[60%]">{item.name} x {cart[item.id]}</span>
                            <span className="font-bold text-orange-600">₹{item.price * cart[item.id]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-orange-50/80 dark:bg-orange-900/40 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-neutral-600 dark:text-neutral-300">Subtotal</span>
                          <span className="font-semibold text-orange-600">₹{getTotalPrice()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-neutral-600 dark:text-neutral-300">Delivery Fee</span>
                          {getDeliveryFee() === 0 ? (
                            <span className="font-semibold text-green-600">FREE</span>
                          ) : (
                            <span className="font-semibold text-orange-600">₹{getDeliveryFee()}</span>
                          )}
                        </div>
                        {getTotalPrice() < 500 && (
                          <div className="text-xs text-orange-500 mb-3">Add ₹{500 - getTotalPrice()} more for free delivery</div>
                        )}
                        {getTotalPrice() >= 500 && (
                          <div className="text-xs text-green-600 mb-3 font-medium">🎉 You unlocked free delivery!</div>
                        )}
                        <div className="border-t pt-3 flex justify-between items-center">
                          <span className="text-xl font-bold text-neutral-900 dark:text-white">Total</span>
                          <span className="text-2xl font-bold text-orange-600">₹{getTotalPrice() + getDeliveryFee()}</span>
                        </div>
                      </div>
                      <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white  rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-500 transition-all duration-300 shadow-xl hover:shadow-2xl block text-center mt-2">
                        <a href="/cart">Proceed to Cart →</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
