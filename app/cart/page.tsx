'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, MapPin, Loader2, ShoppingCart, Home, Building2, MapPinned } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PaymentModal from '@/components/PaymentModal'
import { toast } from '@/components/CustomToaster'
import Loader from '@/components/Loader'

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
  const [loading, setLoading] = useState(true)
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
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressErrors, setAddressErrors] = useState<Record<string,string>>({})

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
  // Basic validation
  const errs: Record<string,string> = {}
  if (!deliveryAddress.name) errs.name = 'Required'
  if (!deliveryAddress.phone) errs.phone = 'Required'
  if (!deliveryAddress.street) errs.street = 'Required'
  if (!deliveryAddress.city) errs.city = 'Required'
  if (!deliveryAddress.state) errs.state = 'Required'
  if (!deliveryAddress.zipCode) errs.zipCode = 'Required'
  setAddressErrors(errs)
  if (Object.keys(errs).length) return
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryAddress)
      })
      
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses([...savedAddresses, data.address])
    setSelectedAddressId(data.address._id)
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
  setSelectedAddressId(address._id || null)
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
        } else {
          setCartItems([])
        }
      } else {
        setCartItems([])
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast.error('Failed to load cart items')
      setCartItems([])
    } finally {
      setLoading(false)
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

  const handlePaymentSuccess = async (_paymentData: any) => {
    try {
      if (!cartItems.length) return
      // Group items by restaurant so each restaurant gets its own order
      const groups = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
        acc[item.restaurant] = acc[item.restaurant] || []
        acc[item.restaurant].push(item)
        return acc
      }, {})

      const restaurantKeys = Object.keys(groups)
      const results: { restaurant: string; ok: boolean }[] = []

    for (const restaurant of restaurantKeys) {
        const itemsForRestaurant = groups[restaurant]
        const subtotalLocal = itemsForRestaurant.reduce((s, i) => s + i.price * i.quantity, 0)
        const deliveryFeeLocal = subtotalLocal >= 500 ? 0 : 40
        const orderData = {
          restaurant,
            items: itemsForRestaurant.map(item => ({
            menuItem: { name: item.name, price: item.price, image: item.image },
            quantity: item.quantity
          })),
          totalAmount: subtotalLocal + deliveryFeeLocal,
          deliveryAddress,
          status: 'confirmed',
      deliveryFee: deliveryFeeLocal,
      combinedTotalAmount: subtotal // overall cart subtotal for free-delivery qualification
        }

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })
        results.push({ restaurant, ok: response.ok })
        if (!response.ok) {
          console.error('Failed to create order for restaurant', restaurant)
        }
      }

      const failed = results.filter(r => !r.ok)
      if (failed.length === 0) {
        await clearCartFromDatabase()
        setCartItems([])
        toast.success(`${results.length === 1 ? 'Order' : results.length + ' orders'} placed successfully!`)
      } else if (failed.length < results.length) {
        toast.error(`Some orders failed (${failed.length}/${results.length}). Please review.`)
      } else {
        toast.error('Failed to place orders')
      }
    } catch (e) {
      console.error(e)
      toast.error('Something went wrong while creating orders')
    }
  }

  if (loading) {
    return <Loader fullscreen message="Loading cart" />
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-8">Shopping Cart</h1>
          <Card className="border-orange-100/70 bg-white/80 backdrop-blur">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-sm text-gray-600 mb-6 max-w-sm">Explore top restaurants and add mouth-watering dishes to start your order.</p>
              <Button asChild>
                <a href="/restaurants" className="gap-2">
                  Browse Restaurants
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-10">Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items Column */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-orange-100/70 bg-white/90 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {cartItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                    <div className="w-20 h-20 shrink-0 rounded-md bg-orange-100 flex items-center justify-center overflow-hidden ring-1 ring-orange-200">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold leading-tight text-sm sm:text-base line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.restaurant}</p>
                          <p className="text-sm font-medium text-orange-600 mt-1">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-orange-100/70">
                <div className="text-sm text-gray-500">Items: <span className="font-medium text-gray-700">{cartItems.length}</span></div>
              </CardFooter>
            </Card>

            {/* Address Card */}
            <Card className="border-orange-100/70 bg-white/90 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-500" /> Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {savedAddresses.length > 0 && !isEditingAddress && (
                  <div className="space-y-4">
                    {selectedAddressId && (
                      <div className="rounded-md border border-orange-200/70 bg-orange-50/60 p-4 flex flex-col gap-2 text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{deliveryAddress.name} <Badge variant="secondary" className="ml-2 text-[10px]">{deliveryAddress.type}</Badge></p>
                            <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.zipCode}</p>
                            <p className="text-gray-500 text-xs">{deliveryAddress.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)} className="text-xs">Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedAddressId(null)} className="text-xs">Change</Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Saved Addresses</h3>
                      {!selectedAddressId && <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}>New</Button>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {savedAddresses.map(addr => {
                        const selected = selectedAddressId === addr._id
                        return (
                          <div
                            key={addr._id}
                            className={`relative rounded-md border p-3 transition cursor-pointer group ${selected ? 'border-orange-400 ring-2 ring-orange-200 bg-orange-50/70' : 'border-orange-100 hover:border-orange-300'}`}
                            onClick={() => selectAddress(addr)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold leading-tight flex items-center gap-1">{addr.name}{selected && <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />}</p>
                                <p className="text-[11px] text-gray-500 line-clamp-2">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                <p className="text-[11px] text-gray-400">{addr.phone}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteAddress(addr._id) }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {selected && <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] capitalize">{addr.type || 'selected'}</Badge>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(savedAddresses.length === 0 || isEditingAddress || !selectedAddressId) && (
                  <div className="space-y-4 border rounded-md border-dashed border-orange-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">{savedAddresses.length ? (isEditingAddress ? 'Edit Address' : 'Add Address') : 'Add Delivery Address'}</p>
                      {savedAddresses.length > 0 && selectedAddressId && !isEditingAddress && (
                        <Button variant="ghost" size="sm" onClick={()=> setIsEditingAddress(true)}>Edit</Button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Full Name *</label>
                        <Input placeholder="Your full name" value={deliveryAddress.name} onChange={e=>{setDeliveryAddress({...deliveryAddress,name:e.target.value}); if(addressErrors.name) setAddressErrors(p=>{const{ name,...r}=p; return r})}} />
                        {addressErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.name}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Phone *</label>
                        <Input type="tel" placeholder="Phone number" value={deliveryAddress.phone} onChange={e=>{setDeliveryAddress({...deliveryAddress,phone:e.target.value}); if(addressErrors.phone) setAddressErrors(p=>{const{ phone,...r}=p; return r})}} />
                        {addressErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.phone}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Street Address *</label>
                      <Input placeholder="House / Flat, Street" value={deliveryAddress.street} onChange={e=>{setDeliveryAddress({...deliveryAddress,street:e.target.value}); if(addressErrors.street) setAddressErrors(p=>{const{ street,...r}=p; return r})}} />
                      {addressErrors.street && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.street}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">City *</label>
                        <Input placeholder="City" value={deliveryAddress.city} onChange={e=>{setDeliveryAddress({...deliveryAddress,city:e.target.value}); if(addressErrors.city) setAddressErrors(p=>{const{ city,...r}=p; return r})}} />
                        {addressErrors.city && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.city}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">State *</label>
                        <Input placeholder="State" value={deliveryAddress.state} onChange={e=>{setDeliveryAddress({...deliveryAddress,state:e.target.value.toUpperCase()}); if(addressErrors.state) setAddressErrors(p=>{const{ state,...r}=p; return r})}} />
                        {addressErrors.state && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.state}</p>}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">PIN Code *</label>
                        <Input placeholder="PIN" value={deliveryAddress.zipCode} onChange={e=>{setDeliveryAddress({...deliveryAddress,zipCode:e.target.value}); if(addressErrors.zipCode) setAddressErrors(p=>{const{ zipCode,...r}=p; return r})}} />
                        {addressErrors.zipCode && <p className="text-[10px] text-red-500 mt-0.5">{addressErrors.zipCode}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Landmark</label>
                        <Input placeholder="Nearby landmark" value={deliveryAddress.landmark} onChange={e=>setDeliveryAddress({...deliveryAddress,landmark:e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Address Type</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val:'home', icon:<Home className='h-3.5 w-3.5' />, label:'Home' },
                          { val:'office', icon:<Building2 className='h-3.5 w-3.5' />, label:'Office' },
                          { val:'other', icon:<MapPinned className='h-3.5 w-3.5' />, label:'Other' },
                        ].map(t => (
                          <Button key={t.val} type="button" variant={deliveryAddress.type===t.val? 'default':'outline'} size="sm" className="gap-1 text-xs" onClick={()=>setDeliveryAddress({...deliveryAddress,type:t.val})}>{t.icon}{t.label}</Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button size="sm" onClick={saveAddress} disabled={!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city}>Save Address</Button>
                      {(isEditingAddress || savedAddresses.length>0) && <Button size="sm" variant="outline" onClick={()=>{ setIsEditingAddress(false); if(savedAddresses.length>0 && selectedAddressId){ const found = savedAddresses.find(a=>a._id===selectedAddressId); if(found) setDeliveryAddress(found) } }}>Cancel</Button>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-orange-100/70 bg-white/90 backdrop-blur sticky top-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{deliveryFee===0 ? <span className="text-green-600">FREE</span> : `₹${deliveryFee}`}</span>
                </div>
                {subtotal >= 500 && (
                  <div className="text-xs font-medium text-green-600 flex items-center gap-1">🎉 Free delivery applied</div>
                )}
                {subtotal < 500 && subtotal > 0 && (
                  <div className="text-xs text-gray-500">Add ₹{500 - subtotal} more for free delivery</div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                <div className="flex justify-between items-center text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-orange-600">₹{total}</span>
                </div>
                <Button className="w-full mt-2" disabled={!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode} onClick={()=>setShowPaymentModal(true)}>
                  Proceed to Payment
                </Button>
                {(!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) && (
                  <p className="text-[11px] text-red-500 text-center">Complete address to continue</p>
                )}
                <p className="text-[11px] text-gray-500 text-center pt-2">By placing your order you agree to our Terms & Privacy.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <PaymentModal isOpen={showPaymentModal} onClose={()=>setShowPaymentModal(false)} totalAmount={total} onPaymentSuccess={handlePaymentSuccess} />
    </div>
  )
}