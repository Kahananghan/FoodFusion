import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

export async function GET() {
  try {
    await dbConnect()
    // Distinct list of approved restaurant cities
    const cities: string[] = await (Restaurant as any).distinct('address.city', { status: 'approved' })
    const cleaned = cities.filter(Boolean).map(c => c.trim()).filter(c => c.length > 0)
    const uniqueSorted = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b))
    return NextResponse.json({ cities: uniqueSorted })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json({ cities: [] }, { status: 500 })
  }
}
