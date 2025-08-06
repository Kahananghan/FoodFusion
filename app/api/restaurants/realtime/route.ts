import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'

interface RealTimeRestaurantData {
  id: string
  name: string
  isOpen: boolean
  currentWaitTime: number
  availableSeats: number
  totalSeats: number
  currentOffers: Array<{
    id: string
    title: string
    description: string
    discount: number
    validUntil: string
  }>
  liveOrders: number
  avgDeliveryTime: number
  busyLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
}

// Simulated real-time data
const generateRealTimeData = (restaurantId: string): RealTimeRestaurantData => {
  const now = new Date()
  const currentHour = now.getHours()
  const isOpen = currentHour >= 9 && currentHour <= 23
  
  return {
    id: restaurantId,
    name: `Restaurant ${restaurantId}`,
    isOpen,
    currentWaitTime: Math.floor(Math.random() * 30) + 5,
    availableSeats: Math.floor(Math.random() * 20),
    totalSeats: 50,
    currentOffers: [
      {
        id: '1',
        title: '20% Off',
        description: 'Get 20% off on orders above ₹500',
        discount: 20,
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }
    ],
    liveOrders: Math.floor(Math.random() * 15) + 1,
    avgDeliveryTime: Math.floor(Math.random() * 20) + 25,
    busyLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
    lastUpdated: now.toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantIds = searchParams.get('ids')?.split(',') || []
    const city = searchParams.get('city')
    
    if (restaurantIds.length === 0 && !city) {
      return NextResponse.json({ error: 'Restaurant IDs or city required' }, { status: 400 })
    }
    
    let realTimeData: RealTimeRestaurantData[] = []
    
    if (city) {
      // Get restaurants from dataset for the city
      const cityRestaurants = datasetAPI.getRestaurants({ city, limit: 10 })
      realTimeData = cityRestaurants.map(r => generateRealTimeData(r.id))
    } else {
      // Generate data for specific restaurants
      realTimeData = restaurantIds.map(id => generateRealTimeData(id))
    }
    
    return NextResponse.json({
      success: true,
      data: realTimeData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch real-time data' }, { status: 500 })
  }
}