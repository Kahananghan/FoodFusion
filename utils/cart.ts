import { toast } from '@/components/CustomToaster'

export interface CartItem {
  name: string
  price: number
  quantity: number
  image: string
  restaurant: string
  userId?: string
}

export const addToCart = async (item: CartItem) => {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...item,
        userId: item.userId || 'guest'
      })
    })

    if (response.status === 401) {
      throw new Error('Authentication required')
    }

    if (response.ok) {
      toast.success('Item added to cart!')
      return true
    } else {
      toast.error('Failed to add item to cart')
      return false
    }
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      throw error
    }
    toast.error('Failed to add item to cart')
    return false
  }
}

export const getCartItems = async () => {
  try {
    const response = await fetch('/api/cart')
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.cartItems : []
    }
    return []
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return []
  }
}