export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  address?: Address
  role: 'customer' | 'restaurant' | 'admin'
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
  createdAt: Date
  estimatedDeliveryTime: Date
}