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
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    type: 'home'
  })
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  useEffect(() => {
    fetchCartItems()
    fetchSavedAddresses()
  }, [])

  const fetchSavedAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses(data.addresses)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const saveAddress = async () => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryAddress)
      })
      
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses([...savedAddresses, data.address])
        toast.success('Address saved successfully!')
        setIsEditingAddress(false)
      } else {
        toast.error('Failed to save address')
      }
    } catch (error) {
      toast.error('Failed to save address')
    }
  }

  const selectAddress = (address: any) => {
    setDeliveryAddress(address)
    setIsEditingAddress(false)
  }

  const deleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/addresses?id=${addressId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSavedAddresses(savedAddresses.filter(addr => addr._id !== addressId))
        toast.success('Address deleted!')
      } else {
        toast.error('Failed to delete address')
      }
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.cartItems) {
          const formattedItems = data.cartItems.map((item: any) => ({
            id: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            restaurant: item.restaurant
          }))
          setCartItems(formattedItems)
        }
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast.error('Failed to load cart items')
    }
  }

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQuantity })
      })

      if (response.ok) {
        const updatedItems = cartItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
        setCartItems(updatedItems)
        window.dispatchEvent(new Event('cartUpdated'))
        toast.success('Quantity updated')
      } else {
        toast.error('Failed to update quantity')
      }
    } catch (error) {
      toast.error('Failed to update quantity')
    }
  }

  const removeItem = async (id: string) => {
    try {
      const response = await fetch(`/api/cart?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedItems = cartItems.filter(item => item.id !== id)
        setCartItems(updatedItems)
        window.dispatchEvent(new Event('cartUpdated'))
        toast.success('Item removed from cart')
      } else {
        toast.error('Failed to remove item')
      }
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const clearCartFromDatabase = async () => {
    try {
      for (const item of cartItems) {
        await fetch(`/api/cart?id=${item.id}`, { method: 'DELETE' })
      }
    } catch (error) {
      console.error('Error clearing cart from database:', error)
    }
  }

  const subtotal = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const total = subtotal + deliveryFee

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const orderData = {
        restaurant: cartItems[0]?.restaurant || 'Unknown Restaurant',
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
        // Clear cart from database
        await clearCartFromDatabase()
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
                <p className="text-sm text-gray-600 mt-1">Please provide your complete delivery address</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && !isEditingAddress && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Addresses</h3>
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <div key={address._id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => selectAddress(address)}>
                            <p className="font-medium text-gray-900">{address.name}</p>
                            <p className="text-sm text-gray-600">{address.street}, {address.city}, {address.state} - {address.zipCode}</p>
                            <p className="text-sm text-gray-500">{address.phone}</p>
                          </div>
                          <button
                            onClick={() => deleteAddress(address._id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="mt-3 text-primary hover:text-orange-600 text-sm font-medium"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}
                
                {/* Address Form */}
                {(savedAddresses.length === 0 || isEditingAddress) && (
                <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={deliveryAddress.name || ''}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={deliveryAddress.phone || ''}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    placeholder="House/Flat No., Building Name, Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      placeholder="PIN Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={deliveryAddress.zipCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="Nearby landmark"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={deliveryAddress.landmark || ''}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="addressType"
                        value="home"
                        checked={deliveryAddress.type === 'home'}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, type: e.target.value })}
                        className="mr-2 text-primary focus:ring-primary"
                      />
                      🏠 Home
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="addressType"
                        value="office"
                        checked={deliveryAddress.type === 'office'}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, type: e.target.value })}
                        className="mr-2 text-primary focus:ring-primary"
                      />
                      🏢 Office
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="addressType"
                        value="other"
                        checked={deliveryAddress.type === 'other'}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, type: e.target.value })}
                        className="mr-2 text-primary focus:ring-primary"
                      />
                      📍 Other
                    </label>
                  </div>
                </div>
                
                {/* Save Address Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={saveAddress}
                    disabled={!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Save Address
                  </button>
                  {isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                </>
                )}

              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          {cartItems.length > 0 && (
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
                    <span>Delivery Fee</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  {subtotal >= 500 && (
                    <div className="text-sm text-green-600 font-medium">
                      🎉 Free delivery on orders above ₹500!
                    </div>
                  )}
                  {subtotal < 500 && subtotal > 0 && (
                    <div className="text-sm text-gray-500">
                      Add ₹{500 - subtotal} more for free delivery
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-black">Total</span>
                      <span className="text-lg font-bold text-primary">₹{total}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    Proceed to Payment
                  </button>
                  
                  {(!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) && (
                    <p className="text-xs text-red-500 text-center mt-2">
                      Please fill all required fields to proceed
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          )}
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