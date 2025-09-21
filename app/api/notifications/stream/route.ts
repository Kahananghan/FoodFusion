import { NextResponse } from 'next/server'
import { addController, removeController, clientCount } from '@/lib/notificationServer'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { socket } = (req as any)
  // Attempt to extract JWT from cookies to identify the user for targeted notifications
  let userId: string | undefined = undefined
  try {
    const cookieHeader = (req as any).headers?.get?.('cookie') || ''
    const match = cookieHeader.match(/token=([^;]+)/)
    if (match) {
      const token = match[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any
      userId = decoded?.userId
    }
  } catch (e) {
    // ignore; leave userId undefined for anonymous streams
  }

  // For Next.js route handlers running on Node, the response creation differs.
  // We'll use a streaming response via ReadableStream.
  const id = randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      // Register controller so broadcasts can reach this client
  addController(id, controller, userId)
      // initial hello message
      controller.enqueue(encode(`event: connected\n`))
      controller.enqueue(encode(`data: ${JSON.stringify({ id, clients: clientCount() })}\n\n`))
    },
    cancel() {
      // client disconnected
      removeController(id)
    }
  })

  // NOTE: we can't easily add Node's ServerResponse here without experimental APIs.
  // Instead we return a streaming Response which client EventSource can connect to.
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  return new Response(stream, { headers })
}

function encode(s: string) {
  return new TextEncoder().encode(s)
}
