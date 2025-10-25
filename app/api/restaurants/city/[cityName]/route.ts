import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { cityName: string } }
) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine') || ''
    const search = searchParams.get('search') || ''

    const city = decodeURIComponent(params.cityName || '')

    const query: any = { status: 'approved' }
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' }
    }
    if (cuisine) {
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
      .limit(100)

    const restaurants = dbRestaurants.map((restaurant: any) => ({
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

    return NextResponse.json({ 
      city: params.cityName,
      restaurants,
      count: restaurants.length 
    })
  } catch (error) {
    console.error('Error in city restaurants API:', error)
    return NextResponse.json({ error: 'Failed to fetch city restaurants' }, { status: 500 })
  }
}