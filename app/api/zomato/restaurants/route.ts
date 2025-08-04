import { NextRequest, NextResponse } from 'next/server'
import { ZomatoAPI } from '@/lib/zomato'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id')
    const cuisineId = searchParams.get('cuisine_id')
    const query = searchParams.get('q')
    
    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 })
    }
    
    const zomato = new ZomatoAPI()
    const restaurants = await zomato.getRestaurants(parseInt(cityId), cuisineId || undefined, query || undefined)
    
    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}