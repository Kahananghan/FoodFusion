// Simple in-memory notification broadcaster for Server-Sent Events (SSE)
// Note: This keeps connections in memory and will not persist across server restarts
// or across multiple server instances. For production, use Redis pub/sub or a message broker.

// Store ReadableStream controllers plus metadata (userId) so we can
// send targeted messages to specific user's connected clients.
type Entry = {
  controller: ReadableStreamDefaultController
  userId?: string
}

const controllers = new Map<string, Entry>()

export function addController(id: string, controller: ReadableStreamDefaultController, userId?: string) {
  controllers.set(id, { controller, userId })
}

export function removeController(id: string) {
  const entry = controllers.get(id)
  if (entry) {
    try {
      entry.controller.close()
    } catch (e) {
      // ignore
    }
    controllers.delete(id)
  }
}

export function broadcast(event: string, data: any) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  const message = `event: ${event}\n` + `data: ${payload}\n\n`
  const targetUser = data && typeof data === 'object' ? data.targetUser : undefined
  for (const entry of Array.from(controllers.values())) {
    try {
      // If data targets a specific user, only send to controllers for that user
      if (targetUser) {
        if (entry.userId && entry.userId === targetUser) {
          entry.controller.enqueue(encode(message))
        }
      } else {
        entry.controller.enqueue(encode(message))
      }
    } catch (e) {
      // ignore individual client failures
    }
  }
}

export function clientCount() {
  return controllers.size
}

function encode(s: string) {
  return new TextEncoder().encode(s)
}
