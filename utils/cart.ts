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
      credentials: 'include',
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
      try {
        const data = await response.json()
        if (data && data.notification) {
          try {
            window.dispatchEvent(new CustomEvent('notificationReceived', { detail: data.notification }))
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore parsing errors
      }
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
  const response = await fetch('/api/cart', { credentials: 'include' })
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