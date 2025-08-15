import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    // Try to find restaurant in database first
    const dbRestaurant = await Restaurant.findById(params.id).populate('owner', 'name email')
    
    if (dbRestaurant) {
      // Transform database restaurant to match frontend format
      const transformedRestaurant = {
        id: dbRestaurant._id.toString(),
        name: dbRestaurant.name,
        cuisines: dbRestaurant.cuisine.join(', '),
        user_rating: {
          aggregate_rating: dbRestaurant.averageRating?.toString() || '4.0',
          rating_text: dbRestaurant.averageRating >= 4 ? 'Very Good' : 'Good'
        },
        location: {
          address: dbRestaurant.address.street,
          locality: dbRestaurant.address.city,
          city: dbRestaurant.address.city
        },
        featured_image: dbRestaurant.image,
        average_cost_for_two: dbRestaurant.minimumOrder * 2,
        currency: '₹'
      }
      
      return NextResponse.json(transformedRestaurant)
    }
    

    
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}