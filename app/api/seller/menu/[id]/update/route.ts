import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const updatedItem = await request.json()
    
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const itemIndex = restaurant.menu.findIndex((item: any) => item._id.toString() === params.id)
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    restaurant.menu[itemIndex] = { ...restaurant.menu[itemIndex], ...updatedItem }
    await restaurant.save()

    return NextResponse.json({ message: 'Menu item updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}