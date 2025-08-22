'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, DollarSign, Users, ShoppingBag, TrendingUp, Store, BarChart3, LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface MenuItem {
  _id?: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isVegetarian: boolean
  isAvailable: boolean
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [isUpdatingRestaurant, setIsUpdatingRestaurant] = useState(false) 
  const [currentRestaurant, setCurrentRestaurant] = useState<any | null>(null)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    image: '',
    cuisine: '' as string, // comma separated input
    deliveryTime: '',
    deliveryFee: '' as string | number, // keep empty for placeholder
    minimumOrder: '' as string | number,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    isOpen: true
  })
  const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeMenuItems: 0,
    avgRating: 0
  })

  const [newItem, setNewItem] = useState<MenuItem>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isVegetarian: false,
    isAvailable: true
  })

  useEffect(() => {
    fetchMenuItems()
    fetchStats()
  checkRestaurant()
    fetchUserInfo()
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders')
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
        setTimeout(() => calculateStatsFromOrders(data.orders || []), 100)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const calculateStatsFromOrders = (ordersList = orders) => {
    const confirmedOrders = ordersList.filter(order => order.status !== 'pending' && order.status !== 'cancelled' && order.status === 'delivered')
    const totalOrders = ordersList.length
    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    
    setStats(prevStats => ({
      totalOrders,
      totalRevenue,
      activeMenuItems: menuItems.length || prevStats.activeMenuItems,
      avgRating: 4.2
    }))
  }

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        toast.success('Order status updated successfully!')
        fetchOrders()
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (res.ok) {
        setUserInfo(data.user)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const checkRestaurant = async () => {
    try {
      const res = await fetch('/api/seller/restaurant')
      const data = await res.json()
      if (data.restaurant) {
        setCurrentRestaurant(data.restaurant)
        setRestaurantForm({
          name: data.restaurant.name || '',
            description: data.restaurant.description || '',
            image: data.restaurant.image || '',
            cuisine: (data.restaurant.cuisine || []).join(', '),
            deliveryTime: data.restaurant.deliveryTime || '',
            deliveryFee: data.restaurant.deliveryFee?.toString() || '',
            minimumOrder: data.restaurant.minimumOrder?.toString() || '',
            address: {
              street: data.restaurant.address?.street || '',
              city: data.restaurant.address?.city || '',
              state: data.restaurant.address?.state || '',
              zipCode: data.restaurant.address?.zipCode || ''
            },
            isOpen: data.restaurant.isOpen !== undefined ? data.restaurant.isOpen : true
        })
      } else {
        setCurrentRestaurant(null)
      }
    } catch (error) {
      console.error('Error checking restaurant:', error)
    }
  }

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...restaurantForm,
      cuisine: restaurantForm.cuisine.split(',').map(c => c.trim()).filter(Boolean),
      deliveryFee: restaurantForm.deliveryFee === '' ? 0 : Number(restaurantForm.deliveryFee),
      minimumOrder: restaurantForm.minimumOrder === '' ? 0 : Number(restaurantForm.minimumOrder)
    }
    try {
      const method = currentRestaurant ? 'PUT' : 'POST'
      const res = await fetch('/api/seller/restaurant', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(currentRestaurant ? 'Restaurant updated' : 'Restaurant created')
        setShowRestaurantModal(false)
        setIsUpdatingRestaurant(false)
        checkRestaurant()
      } else {
        toast.error(data.error || 'Failed to save restaurant')
      }
    } catch (err) {
      toast.error('Failed to save restaurant')
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/seller/menu')
      const data = await res.json()
      if (res.ok) {
        setMenuItems(data.menuItems || [])
        // Update stats after menu items are loaded
        setTimeout(() => {
          setStats(prevStats => ({
            ...prevStats,
            activeMenuItems: data.menuItems?.length || 0
          }))
        }, 100)
      } else {
        console.error('Fetch menu error:', data)
        if (data.error === 'Restaurant not found') {
          toast.error('Please create your restaurant profile first')
        } else {
          toast.error(data.error || 'Failed to fetch menu items')
        }
      }
    } catch (error) {
      console.error('Request error:', error)
      toast.error('Failed to fetch menu items')
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/seller/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to fetch stats')
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/seller/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('Menu item added successfully!')
        setShowAddModal(false)
        setNewItem({
          name: '',
          description: '',
          price: 0,
          category: '',
          image: '',
          isVegetarian: false,
          isAvailable: true
        })
        fetchMenuItems()
      } else {
        toast.error(data.error || 'Failed to add menu item')
        console.error('API Error:', data)
      }
    } catch (error) {
      console.error('Request Error:', error)
      toast.error('Something went wrong')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await fetch(`/api/seller/menu/${id}`, {
          method: 'DELETE'
        })

        if (res.ok) {
          toast.success('Menu item deleted successfully!')
          fetchMenuItems()
        } else {
          toast.error('Failed to delete menu item')
        }
      } catch (error) {
        toast.error('Something went wrong')
      }
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        toast.error('Logged out successfully')
        window.location.href = '/'
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seller Navigation Bar */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">FoodFusion</h1>
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">Seller Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="bg-gray-600 p-2 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-white text-sm">
                    <div className="font-medium">{userInfo.name}</div>
                    <div className="text-gray-300 text-xs">{userInfo.email}</div>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Restaurant Heading / Banner */}
        {currentRestaurant ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">{currentRestaurant.name}</h2>
              <div className="mt-1 flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentRestaurant.status === 'approved' ? 'bg-green-100 text-green-700' : currentRestaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{currentRestaurant.status || 'approved'}</span>
                <span className="text-gray-500">Restaurant Profile</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsUpdatingRestaurant(true)
                  setShowRestaurantModal(true)
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm"
              >
                Edit Restaurant
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">No restaurant created yet</h2>
              <p className="text-sm text-blue-700 mt-1">Create your restaurant profile to start adding menu items and receiving orders.</p>
            </div>
            <button
              onClick={() => {
                setIsUpdatingRestaurant(false)
                setShowRestaurantModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
            >
              + Create Restaurant
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'menu', label: 'Menu Management', icon: Store },
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                { id: 'reports', label: 'Sales Reports', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMenuItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-yellow-600" /> Sales Reports
            </h2>
            {orders.filter(order => order.status === 'delivered').length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-lg">No sales data available</div>
            ) : (
              <>
                {/* Summary */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="bg-green-50 rounded-xl px-6 py-4 flex flex-col items-center shadow-sm min-w-[180px]">
                    <span className="text-xs text-gray-500 font-medium mb-1">Total Delivered Orders</span>
                    <span className="text-2xl font-bold text-green-700">{orders.filter(order => order.status === 'delivered').length}</span>
                  </div>
                  <div className="bg-blue-50 rounded-xl px-6 py-4 flex flex-col items-center shadow-sm min-w-[180px]">
                    <span className="text-xs text-gray-500 font-medium mb-1">Total Sales</span>
                    <span className="text-2xl font-bold text-blue-700">
                      ₹{orders.filter(order => order.status === 'delivered').reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-purple-50 rounded-xl px-6 py-4 flex flex-col items-center shadow-sm min-w-[180px]">
                    <span className="text-xs text-gray-500 font-medium mb-1">Total Earning (70%)</span>
                    <span className="text-2xl font-bold text-purple-700">
                      ₹{orders.filter(order => order.status === 'delivered').reduce((sum, order) => sum + Math.round((order.totalAmount || 0) * 0.7), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Seller Earning (70%)</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(order => order.status === 'delivered').map((order, idx) => (
                        <tr key={order._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-500">{order.orderNumber || order._id.slice(-6)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">₹{(order.totalAmount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold text-green-700">₹{Math.round((order.totalAmount || 0) * 0.7).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Delivered</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
                <div className="flex">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-4xl">🍽️</span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.isVegetarian ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          Veg
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          Non-Veg
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-primary">₹{item.price}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id!)}
                        className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-black">Edit Menu Item</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const res = await fetch(`/api/seller/menu/${editingItem._id}/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingItem)
                  })
                  
                  if (res.ok) {
                    toast.success('Item updated successfully!')
                    setEditingItem(null)
                    fetchMenuItems()
                  } else {
                    const data = await res.json()
                    toast.error(data.error || 'Failed to update item')
                  }
                } catch (error) {
                  toast.error('Something went wrong')
                }
              }} className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                />
                <input
                  type="text"
                  placeholder="Category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editingItem.image}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                />
                <div className="flex items-center flex-wrap gap-4 text-black">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="radio"
                        name="edit-veg-type"
                        className="mr-2"
                        checked={editingItem.isVegetarian === true}
                        onChange={() => setEditingItem({ ...editingItem, isVegetarian: true })}
                      />
                      Veg
                    </label>
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="radio"
                        name="edit-veg-type"
                        className="mr-2"
                        checked={editingItem.isVegetarian === false}
                        onChange={() => setEditingItem({ ...editingItem, isVegetarian: false })}
                      />
                      Non-Veg
                    </label>
                  </div>
                  <label className="flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={editingItem.isAvailable}
                      onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Update Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restaurant Modal */}
        {showRestaurantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-black">
                {currentRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
              </h3>
              <form onSubmit={handleRestaurantSubmit} className="space-y-4">
                <input type="text" placeholder="Name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.name} onChange={e=>setRestaurantForm(f=>({...f,name:e.target.value}))} />
                <textarea placeholder="Description" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.description} onChange={e=>setRestaurantForm(f=>({...f,description:e.target.value}))} />
                <input type="url" placeholder="Image URL" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.image} onChange={e=>setRestaurantForm(f=>({...f,image:e.target.value}))} />
                <input type="text" placeholder="Cuisine (comma separated)" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.cuisine} onChange={e=>setRestaurantForm(f=>({...f,cuisine:e.target.value}))} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Delivery Time" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.deliveryTime} onChange={e=>setRestaurantForm(f=>({...f,deliveryTime:e.target.value}))} />
                  <input type="number" placeholder="Delivery Fee" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.deliveryFee} onChange={e=>{
                    const val = e.target.value
                    setRestaurantForm(f=>({...f,deliveryFee: val === '' ? '' : val}))
                  }} />
                  <input type="number" placeholder="Minimum Order" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.minimumOrder} onChange={e=>{
                    const val = e.target.value
                    setRestaurantForm(f=>({...f,minimumOrder: val === '' ? '' : val}))
                  }} />
                  <label className="flex items-center text-sm text-black space-x-2"><input type="checkbox" checked={restaurantForm.isOpen} onChange={e=>setRestaurantForm(f=>({...f,isOpen:e.target.checked}))} /> <span>Open</span></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Street" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.address.street} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,street:e.target.value}}))} />
                  <input type="text" placeholder="City" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.address.city} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,city:e.target.value}}))} />
                  <input type="text" placeholder="State" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.address.state} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,state:e.target.value}}))} />
                  <input type="text" placeholder="Zip Code" required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={restaurantForm.address.zipCode} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,zipCode:e.target.value}}))} />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestaurantModal(false)
                      setIsUpdatingRestaurant(false)
                    }}
                    className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    {currentRestaurant ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Restaurant Orders</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders yet
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.orderNumber || order._id.slice(-6)}</h3>
                          <p className="text-gray-600">{order.customer?.name || 'Customer'}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">₹{order.totalAmount}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-1">Items:</h4>
                        <div className="text-sm text-gray-600">
                          {order.items?.map((item: any, index: number) => (
                            <div key={index}>
                              {item.quantity}x {item.menuItem?.name || item.name} - ₹{(item.menuItem?.price || item.price) * item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'confirmed')}
                              className="bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors text-sm"
                            >
                              Confirm Order
                            </button>
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'cancelled')}
                              className="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleOrderStatusUpdate(order._id, 'preparing')}
                            className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleOrderStatusUpdate(order._id, 'ready')}
                            className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                          >
                            Mark Ready
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-black">Add New Menu Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                />
                <input
                  type="text"
                  placeholder="Category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                />
                <div className="flex items-center flex-wrap gap-4 text-black">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="radio"
                        name="add-veg-type"
                        className="mr-2"
                        checked={newItem.isVegetarian === true}
                        onChange={() => setNewItem({ ...newItem, isVegetarian: true })}
                      />
                      Veg
                    </label>
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="radio"
                        name="add-veg-type"
                        className="mr-2"
                        checked={newItem.isVegetarian === false}
                        onChange={() => setNewItem({ ...newItem, isVegetarian: false })}
                      />
                      Non-Veg
                    </label>
                  </div>
                  <label className="flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newItem.isAvailable}
                      onChange={(e) => setNewItem({ ...newItem, isAvailable: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}