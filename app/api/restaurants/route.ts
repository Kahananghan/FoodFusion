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
    const state = searchParams.get('state')
    const zipCode = searchParams.get('zipCode')
    
    let query: any = { status: 'approved', isOpen: true }
    
    if (cuisine) {
      query.cuisine = { $in: [cuisine] }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' }
    }
    
    if (state) {
      query['address.state'] = { $regex: state, $options: 'i' }
    }
    
    if (zipCode) {
      query['address.zipCode'] = zipCode
    }
    
    const restaurants = await Restaurant.find(query).populate('owner', 'name email')
    
    return NextResponse.json({ restaurants })
  } catch (error) {
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