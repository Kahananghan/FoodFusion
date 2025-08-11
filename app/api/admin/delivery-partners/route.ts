import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const partners = await User.find({ role: 'delivery' })
      .select('name email phone status rating totalDeliveries earnings location')
      .sort({ createdAt: -1 })

    return NextResponse.json({ partners })
  } catch (error) {
    console.error('Error fetching delivery partners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}