import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    
    return NextResponse.json({ 
      hasRestaurant: !!restaurant,
      restaurant: restaurant ? {
        id: restaurant._id,
        name: restaurant.name,
        status: restaurant.status
      } : null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check restaurant' }, { status: 500 })
  }
}