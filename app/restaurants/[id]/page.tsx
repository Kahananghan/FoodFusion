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
    <div className="min-h-screen px-4 sm:px-6 lg:px-20 bg-gradient-to-br from-orange-50/60 via-white to-orange-100/80 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      {restaurant && (
        <>
          {/* Hero Section */}
          <div className="relative group h-[220px] sm:h-[260px] md:h-[360px] lg:h-[420px] flex items-end justify-center">
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner">
              <Image
                  src={restaurant.featured_image || ''}
                  alt={restaurant.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                  quality={80}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  className="transform transition-transform duration-500 hover:scale-[1.02] filter brightness-90 contrast-105"
               />
              {/* linear dark gradient + subtle radial vignette to focus center */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45),rgba(0,0,0,0.0)_40%)]" />
            </div>
            {/* mobile overlay title for stronger immediate impression */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 md:hidden text-center px-3">
              <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg truncate max-w-[90vw]">{restaurant.name}</h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 truncate max-w-[90vw]">{restaurant.cuisines}</p>
            </div>

            <Card className="absolute left-3 sm:left-4 md:left-8 lg:left-8 bottom-4 translate-y-1/2 md:translate-y-2 w-[94vw] sm:w-[90vw] md:w-[72%] lg:w-[65%] max-w-5xl shadow-3xl border-0 bg-transparent backdrop-blur-none transition-transform duration-400 pointer-events-none">
              <CardContent className="py-6 px-4 md:px-8 flex flex-col md:flex-row md:items-center gap-4 pointer-events-auto">
                <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                  <Image src={restaurant.featured_image || ''} alt={`${restaurant.name} thumbnail`} width={80} height={80} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 text-white">
                  {/* Hide the large title on small screens - use the mobile overlay title instead */}
                  <h1 className="hidden md:block text-3xl md:text-3xl lg:text-4xl font-extrabold mb-1 tracking-tight drop-shadow-lg">{restaurant.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-1.5 text-white/90">
                    <div className="flex items-center gap-1 bg-white/10 px-1 py-0.5 rounded-md self-start sm:self-auto">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                      <span className="font-medium text-xs sm:text-sm">{restaurant.user_rating.aggregate_rating}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 text-xs sm:text-sm text-white/80 truncate">
                      <span className="truncate max-w-[55vw] sm:max-w-[40vw]">{restaurant.user_rating.rating_text}</span>
                      <span className="hidden sm:inline text-white/40">•</span>
                      <span className="truncate max-w-[45vw] sm:max-w-[30vw]">{restaurant.location.city}{restaurant.location.state ? `, ${restaurant.location.state}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-2">
                    <div className="hidden md:block flex flex-wrap gap-1">
                      {restaurant.cuisines?.split(',').slice(0,3).map((c,i) => (
                        <span key={i} className="text-[10px] sm:text-[13px] px-2 py-0.5 sm:py-1 bg-white/10 text-white rounded-md truncate">{c.trim()}</span>
                      ))}
                    </div>
                    <span className="ml-0 sm:ml-2 text-[11px] sm:text-sm text-white/70">• Avg ₹{restaurant.average_cost_for_two}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="menu" className="max-w-7xl mx-auto px-0 sm:px-4 pt-20 sm:pt-24 pb-12 grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">Menu</h2>
                <Separator className="ml-4 h-1 flex-1 bg-orange-500 dark:bg-orange-300/20" />
              </div>
              <div className="space-y-8">
                {menuItems.map((item) => (
                  <Card key={item.id} className="flex flex-col sm:flex-row items-stretch bg-white/80 dark:bg-neutral-900/80 border-0 shadow-lg backdrop-blur-xl overflow-hidden">
                    <div className="relative w-full sm:w-48 md:w-56 h-40 sm:h-36 md:h-auto flex-shrink-0">
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
                      <div className="flex items-center justify-between mt-4 gap-3">
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
                            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
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
            <div className="lg:col-span-1 mt-8 lg:mt-16">
              {getTotalItems() > 0 && (
                <Card className="shadow-2xl border-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-2xl w-full lg:sticky lg:top-24">
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
