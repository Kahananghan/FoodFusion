import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET() {
  try {
    await dbConnect()
    // Distinct cuisine values (array field) for approved restaurants
    const cuisines: string[] = await (Restaurant as any).distinct('cuisine', { status: 'approved' })
    const cleaned = cuisines.filter(Boolean).map(c => c.trim()).filter(c => c.length > 0)
    const uniqueSorted = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b))
    return NextResponse.json({ cuisines: uniqueSorted })
  } catch (error) {
    console.error('Error fetching cuisines:', error)
    return NextResponse.json({ cuisines: [] }, { status: 500 })
  }
}
