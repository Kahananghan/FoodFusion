import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('id')
  
  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 })
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = () => {
        const data = {
          id: restaurantId,
          timestamp: new Date().toISOString(),
          liveOrders: Math.floor(Math.random() * 20) + 1,
          waitTime: Math.floor(Math.random() * 25) + 10,
          availableSeats: Math.floor(Math.random() * 15),
          busyLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        }
        
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }
      
      // Send initial data
      sendUpdate()
      
      // Send updates every 30 seconds
      const interval = setInterval(sendUpdate, 30000)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}