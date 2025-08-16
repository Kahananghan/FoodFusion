import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { name } = await request.json()
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 })
    }
    
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant already exists for this user' }, { status: 400 })
    }
    
    // Create a basic restaurant profile
    const restaurant = new Restaurant({
      name: name.trim(),
      description: 'A great place to eat',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop',
      cuisine: ['Indian'],
      deliveryTime: '30-45 mins',
      deliveryFee: 40,
      minimumOrder: 200,
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      owner: decoded.userId,
      status: 'approved'
    })
    
    const savedRestaurant = await restaurant.save()

    return NextResponse.json({ message: 'Restaurant created successfully', restaurant: savedRestaurant }, { status: 201 })
  } catch (error) {
    console.error('Restaurant creation error:', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { name } = await request.json()
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 })
    }
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: decoded.userId },
      { name: name.trim() },
      { new: true }
    )
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Restaurant updated successfully', restaurant }, { status: 200 })
  } catch (error) {
    console.error('Restaurant update error:', error)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}