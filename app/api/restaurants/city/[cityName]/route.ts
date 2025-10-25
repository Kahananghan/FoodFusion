import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'

export async function GET(
  request: NextRequest,
  { params }: { params: { cityName: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine')
    const search = searchParams.get('search')
    
    const restaurants = datasetAPI.getRestaurants({
      city: decodeURIComponent(params.cityName),
      cuisine: cuisine || undefined,
      search: search || undefined
    })
    
    return NextResponse.json({ 
      city: params.cityName,
      restaurants,
      count: restaurants.length 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch city restaurants' }, { status: 500 })
  }
}