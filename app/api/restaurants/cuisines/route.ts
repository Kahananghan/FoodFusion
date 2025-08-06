import { NextRequest, NextResponse } from 'next/server'
import { datasetAPI } from '@/lib/dataset'

export async function GET(request: NextRequest) {
  try {
    const cuisines = datasetAPI.getCuisines()
    return NextResponse.json({ cuisines })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cuisines' }, { status: 500 })
  }
}