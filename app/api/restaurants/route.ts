import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine') || ''
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const limit = searchParams.get('limit')

    // Build MongoDB query directly instead of filtering in memory
    const query: any = { status: 'approved' }
    if (city) {
      // Match city case-insensitively
      query['"address.city"'.replace('"','').replace('"','')] = { $regex: city, $options: 'i' }
    }
    if (cuisine) {
      // cuisine is an array field
      query['cuisine'] = { $regex: cuisine, $options: 'i' }
    }
    if (search) {
      query['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ]
    }

    const dbRestaurants = await (Restaurant as any)
      .find(query)
      .populate('owner', 'name email')
      .limit(limit ? parseInt(limit) : 50)

    const transformed = dbRestaurants.map((restaurant: any) => ({
      id: restaurant._id.toString(),
      name: restaurant.name,
      cuisines: restaurant.cuisine.join(', '),
      user_rating: {
        aggregate_rating: restaurant.averageRating?.toString() || '4.0',
        rating_text: (restaurant.averageRating || 0) >= 4 ? 'Very Good' : 'Good'
      },
      location: {
        address: restaurant.address.street,
        city: restaurant.address.city,
        state: restaurant.address.state
      },
      featured_image: restaurant.image,
      average_cost_for_two: restaurant.minimumOrder * 2,
      currency: '₹',
      has_online_delivery: 1
    }))

    return NextResponse.json({ restaurants: transformed })
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