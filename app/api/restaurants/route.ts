import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const limit = searchParams.get('limit')
    
    // Get approved restaurants from database
    const dbRestaurants = await Restaurant.find({ status: 'approved' })
      .populate('owner', 'name email')
      .limit(limit ? parseInt(limit) : 50)
  
    
    // Transform database restaurants to match frontend format
    const transformedDbRestaurants = dbRestaurants.map(restaurant => ({
      id: restaurant._id.toString(),
      name: restaurant.name,
      cuisines: restaurant.cuisine.join(', '),
      user_rating: {
        aggregate_rating: restaurant.averageRating?.toString() || '4.0',
        rating_text: restaurant.averageRating >= 4 ? 'Very Good' : 'Good'
      },
      location: {
        address: restaurant.address.street,
        locality: restaurant.address.city,
        city: restaurant.address.city
      },
      featured_image: restaurant.image,
      average_cost_for_two: restaurant.minimumOrder * 2,
      currency: '₹',
      has_online_delivery: 1
    }))
    
    
    // Apply filters to database restaurants
    let filteredRestaurants = transformedDbRestaurants
    
    if (search) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisines.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (cuisine) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.cuisines.toLowerCase().includes(cuisine.toLowerCase())
      )
    }
    
    if (city) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.location.city.toLowerCase().includes(city.toLowerCase())
      )
    }
    
    return NextResponse.json({ restaurants: filteredRestaurants })
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