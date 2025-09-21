import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const token = req.cookies.get('token')?.value
    if (!token) {
      console.log('[notifications GET] no token on request')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    let userId: string | undefined
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any
      userId = decoded.userId
    } catch (e) {
      console.warn('[notifications GET] failed to verify token', e)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  // Read embedded notifications from user document
  const user = await (User as any).findOne({ _id: userId }).select('notifications').lean()
  const notes = (user && (user as any).notifications) || []
  // sort by createdAt desc and limit
  notes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const limited = notes.slice(0, 50)
  return NextResponse.json({ notifications: limited })
  } catch (e) {
    console.error('[notifications GET] error', e)
    return NextResponse.json({ notifications: [] })
  }
}
