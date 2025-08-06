import { NextRequest, NextResponse } from 'next/server'

interface RestaurantOffer {
  id: string
  restaurantId: string
  title: string
  description: string
  discount: number
  minOrderValue: number
  maxDiscount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  usageCount: number
  maxUsage: number
}

// Dynamic offers based on time and restaurant activity
const generateOffers = (restaurantId?: string): RestaurantOffer[] => {
  const now = new Date()
  const currentHour = now.getHours()
  const offers: RestaurantOffer[] = []
  
  // Happy hour offers (3-6 PM)
  if (currentHour >= 15 && currentHour <= 18) {
    offers.push({
      id: `happy-${restaurantId || 'all'}`,
      restaurantId: restaurantId || 'all',
      title: 'Happy Hour Special',
      description: 'Get 25% off on all beverages',
      discount: 25,
      minOrderValue: 200,
      maxDiscount: 150,
      validFrom: new Date(now.setHours(15, 0, 0, 0)).toISOString(),
      validUntil: new Date(now.setHours(18, 0, 0, 0)).toISOString(),
      isActive: true,
      usageCount: Math.floor(Math.random() * 50),
      maxUsage: 100
    })
  }
  
  // Lunch offers (12-3 PM)
  if (currentHour >= 12 && currentHour <= 15) {
    offers.push({
      id: `lunch-${restaurantId || 'all'}`,
      restaurantId: restaurantId || 'all',
      title: 'Lunch Combo Deal',
      description: 'Buy any main course and get 50% off on dessert',
      discount: 50,
      minOrderValue: 300,
      maxDiscount: 200,
      validFrom: new Date(now.setHours(12, 0, 0, 0)).toISOString(),
      validUntil: new Date(now.setHours(15, 0, 0, 0)).toISOString(),
      isActive: true,
      usageCount: Math.floor(Math.random() * 30),
      maxUsage: 75
    })
  }
  
  // Weekend offers
  if (now.getDay() === 0 || now.getDay() === 6) {
    offers.push({
      id: `weekend-${restaurantId || 'all'}`,
      restaurantId: restaurantId || 'all',
      title: 'Weekend Special',
      description: 'Free delivery on orders above ₹500',
      discount: 100,
      minOrderValue: 500,
      maxDiscount: 50,
      validFrom: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
      validUntil: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
      isActive: true,
      usageCount: Math.floor(Math.random() * 20),
      maxUsage: 50
    })
  }
  
  // Always available offers
  offers.push({
    id: `first-order-${restaurantId || 'all'}`,
    restaurantId: restaurantId || 'all',
    title: 'First Order Discount',
    description: 'Get 20% off on your first order',
    discount: 20,
    minOrderValue: 250,
    maxDiscount: 100,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    usageCount: Math.floor(Math.random() * 100),
    maxUsage: 200
  })
  
  return offers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const city = searchParams.get('city')
    const active = searchParams.get('active') === 'true'
    
    let offers = generateOffers(restaurantId || undefined)
    
    if (active) {
      offers = offers.filter(offer => offer.isActive)
    }
    
    return NextResponse.json({
      success: true,
      offers,
      count: offers.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}