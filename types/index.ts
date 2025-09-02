export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  address?: Address
  role: 'customer' | 'restaurant' | 'admin' | 'delivery'
  isActive: boolean
  createdAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface Restaurant {
  _id: string
  name: string
  description: string
  image: string
  cuisine: string[]
  rating: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  address: Address
  menu: MenuItem[]
  isOpen: boolean
  status: 'pending' | 'approved' | 'rejected'
  owner: string
}

export interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVegetarian: boolean
  isAvailable: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  restaurant: Restaurant
}

// Simple cart item shape used by the embedded User.cart in the database
export interface SimpleCartItem {
  _id?: string
  name: string
  price: number
  quantity: number
  image?: string
  restaurant: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Order {
  _id: string
  user: User
  restaurant: Restaurant
  items: {
    menuItem: MenuItem
    quantity: number
  }[]
  totalAmount: number
  deliveryAddress: Address
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  deliveryPersonId?: string
  deliveryFee: number
  createdAt: Date
  estimatedDeliveryTime: Date
}

// Extend User interface with optional cart embedded items
export interface UserWithCart extends User {
  cart?: SimpleCartItem[]
}