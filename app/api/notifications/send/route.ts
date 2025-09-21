import { NextResponse } from 'next/server'
import { broadcast } from '@/lib/notificationServer'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event = 'notification', data } = body

    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    broadcast(event, data)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
