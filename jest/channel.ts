// El canal de avisos del servidor falso para las pruebas de componentes y
// hooks que escuchan `useServerEvent`.
import { HttpResponse, http } from 'msw'

import type { ErrorCode } from '../src/api/types'
import { mswServer } from './mswServer'

/**
 * El canal de avisos del servidor (`GET /events`, SSE sobre `fetch`). Cada
 * conexión abierta queda en `conexiones`; `emitir` escribe un aviso en todas.
 */
export class FakeChannel {
  readonly connections: { url: string; authorization: string | null }[] = []
  private readonly flows = new Set<ReadableStreamDefaultController<Uint8Array>>()
  private status = 200
  private code: ErrorCode | undefined

  /** Las próximas conexiones responden con este estado y el `code` del error del API (p. ej. 401 `unauthenticated`). */
  respondWith(status: number, code?: ErrorCode): void {
    this.status = status
    this.code = code
  }

  issue(type: string, data: string): void {
    const block = new TextEncoder().encode(`event: ${type}\ndata: ${data}\n\n`)
    for (const flow of this.flows) {
      flow.enqueue(block)
    }
  }

  /** El servidor corta todas las conexiones abiertas. */
  cut(): void {
    for (const flow of this.flows) {
      flow.close()
    }
    this.flows.clear()
  }

  /** El manejador de MSW del canal: abre un flujo por conexión, o responde con el estado dado. */
  readonly handler = http.get('*/api/v1/events', ({ request }) => {
    this.connections.push({ url: request.url, authorization: request.headers.get('Authorization') })
    if (this.status !== 200) {
      return this.code === undefined
        ? new HttpResponse(null, { status: this.status })
        : HttpResponse.json({ detail: 'Error de prueba', code: this.code }, { status: this.status })
    }
    const flows = this.flows
    const body = new ReadableStream<Uint8Array>({
      start(handler) {
        flows.add(handler)
        request.signal.addEventListener('abort', () => {
          flows.delete(handler)
        })
      },
    })
    return new HttpResponse(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  })
}

/** Reemplaza el canal de avisos por uno falso para la prueba en curso. */
export function noticesChannel(): FakeChannel {
  const channel = new FakeChannel()
  mswServer.use(channel.handler)
  return channel
}
