import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'

export async function GET(request: NextRequest) {
  try {
    const cities = datasetAPI.getCities()
    return NextResponse.json({ cities })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}