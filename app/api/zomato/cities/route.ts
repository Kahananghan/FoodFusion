import { NextRequest, NextResponse } from 'next/server'
import { ZomatoAPI } from '@/lib/zomato'

export async function GET(request: NextRequest) {
  try {
    const zomato = new ZomatoAPI()
    const cities = await zomato.getCities('India')
    
    return NextResponse.json({ cities })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}