import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'

// Generate real-time data for restaurant
const generateRealTimeData = () => {
  const now = new Date()
  const currentHour = now.getHours()
  
  return {
    isOpen: currentHour >= 9 && currentHour <= 23,
    currentWaitTime: Math.floor(Math.random() * 30) + 5,
    liveOrders: Math.floor(Math.random() * 15) + 1,
    avgDeliveryTime: Math.floor(Math.random() * 20) + 25,
    busyLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
    lastUpdated: now.toISOString()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = datasetAPI.getRestaurantById(params.id)
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    // Add real-time data and stats from dataset
    const realTimeData = generateRealTimeData()
    const stats = datasetAPI.getRestaurantStats(params.id)
    
    const enhancedRestaurant = {
      ...restaurant,
      ...realTimeData,
      stats
    }
    
    return NextResponse.json(enhancedRestaurant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}