import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET() {
  try {
    await dbConnect()
    
    const locations = await Restaurant.aggregate([
      { $match: { status: 'approved', isOpen: true } },
      {
        $group: {
          _id: null,
          cities: { $addToSet: '$address.city' },
          states: { $addToSet: '$address.state' }
        }
      }
    ])
    
    return NextResponse.json({
      cities: locations[0]?.cities || [],
      states: locations[0]?.states || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}