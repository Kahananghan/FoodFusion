import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({ menuItems: restaurant.menu })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const menuItem = await request.json()
    
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    restaurant.menu.push(menuItem)
    await restaurant.save()

    return NextResponse.json({ message: 'Menu item added successfully' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add menu item' }, { status: 500 })
  }
}