import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    
    await connectDB()
    
    const partner = await User.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    )

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}