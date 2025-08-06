import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'
import dbConnect from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const limit = searchParams.get('limit')
    
    const restaurants = datasetAPI.getRestaurants({
      cuisine: cuisine || undefined,
      search: search || undefined,
      city: city || undefined,
      limit: limit ? parseInt(limit) : undefined
    })

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Error in restaurants API:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const restaurant = new Restaurant(body)
    await restaurant.save()
    
    return NextResponse.json({ restaurant }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}