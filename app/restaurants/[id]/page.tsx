'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, MapPin, Plus, Minus } from 'lucide-react'
import { addToCart as addToCartDB } from '@/utils/cart'
import Loader from '@/components/Loader'
import { toast } from '@/components/CustomToaster'

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
      const res = await fetch('/api/cart')
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
        fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' })
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
                    {restaurant.location.city}{restaurant.location.state ? `, ${restaurant.location.state}` : ''}
                  </p>
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
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                          {item.isVegetarian !== undefined && (
                            item.isVegetarian ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Veg</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Non-Veg</span>
                            )
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-primary">₹{item.price}</span>
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
                        <span className="font-semibold text-primary">₹{getTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Delivery Fee</span>
                        {getDeliveryFee() === 0 ? (
                          <span className="font-semibold text-green-600">FREE</span>
                        ) : (
                          <span className="font-semibold text-orange-600">₹{getDeliveryFee()}</span>
                        )}
                      </div>
                      {getTotalPrice() < 500 && (
                        <div className="text-xs text-gray-500 mb-3">Add ₹{500 - getTotalPrice()} more for free delivery</div>
                      )}
                      {getTotalPrice() >= 500 && (
                        <div className="text-xs text-green-600 mb-3 font-medium">🎉 You unlocked free delivery!</div>
                      )}
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{getTotalPrice() + getDeliveryFee()}</span>
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
