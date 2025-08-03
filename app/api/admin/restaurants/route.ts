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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const restaurants = await Restaurant.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}