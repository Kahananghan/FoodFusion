'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, MapPin } from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  restaurant: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    fetchCartFromOrders()
  }, [])

  const fetchCartFromOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        // Get the latest order and convert its items to cart format
        if (data.orders && data.orders.length > 0) {
          const latestOrder = data.orders[0]
          const cartItems = latestOrder.items.map((item: any) => ({
            id: item.menuItem?.name || Date.now().toString(),
            name: item.menuItem?.name || 'Item',
            price: item.menuItem?.price || 0,
            quantity: item.quantity || 1,
            image: item.menuItem?.image || '',
            restaurant: 'Restaurant'
          }))
          setCartItems(cartItems)
        }
      }
    } catch (error) {
      console.error('Error fetching cart from orders:', error)
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id)
      return
    }

    if (!Array.isArray(cartItems)) return
    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedItems)
  }

  const removeItem = (id: string) => {
    if (!Array.isArray(cartItems)) return
    const updatedItems = cartItems.filter(item => item.id !== id)
    setCartItems(updatedItems)
    toast.success('Item removed from cart')
  }

  const subtotal = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0
  const deliveryFee = 40
  const total = subtotal + deliveryFee

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const orderData = {
        user: '507f1f77bcf86cd799439011',
        restaurant: '507f1f77bcf86cd799439012',
        items: cartItems.map(item => ({
          menuItem: {
            name: item.name,
            price: item.price,
            image: item.image
          },
          quantity: item.quantity
        })),
        totalAmount: total,
        deliveryAddress,
        status: 'confirmed',
        deliveryFee: deliveryFee
      }

      // Save order to database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        // Clear cart
        setCartItems([])
        toast.success('Order placed successfully!')
      } else {
        throw new Error('Failed to place order')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Start adding some delicious items from our restaurants!
              </p>
              <a
                href="/restaurants"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Browse Restaurants
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {Array.isArray(cartItems) && cartItems.map((item) => (
                  <div key={item.id} className="p-6 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">🍽️</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.restaurant}</p>
                      <p className="text-primary font-bold">₹{item.price}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-gray-600">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </h2>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="City"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="State"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={deliveryAddress.zipCode}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span >Delivery Fee</span>
                  <span className="font-semibold">₹{deliveryFee}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-black">Total</span>
                    <span className="text-lg font-bold text-primary">₹{total}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('Payment button clicked', { showPaymentModal, deliveryAddress })
                    setShowPaymentModal(true)
                  }}
                  disabled={!deliveryAddress.street || !deliveryAddress.city}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  Proceed to Payment
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={total}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}