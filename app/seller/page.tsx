'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, DollarSign, Users, ShoppingBag, TrendingUp } from 'lucide-react'
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
  }, [])

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/seller/menu')
      const data = await res.json()
      if (res.ok) {
        setMenuItems(data.menuItems)
      }
    } catch (error) {
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
        toast.error('Failed to add menu item')
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant and menu items</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'menu', label: 'Menu Management' },
                { id: 'orders', label: 'Orders' },
                { id: 'reports', label: 'Sales Reports' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
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
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
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

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
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
                    <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-primary">${item.price}</span>
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

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Menu Item</h3>
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
                  step="0.01"
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
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newItem.isVegetarian}
                      onChange={(e) => setNewItem({ ...newItem, isVegetarian: e.target.checked })}
                    />
                    Vegetarian
                  </label>
                  <label className="flex items-center">
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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