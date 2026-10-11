// El canal de avisos del servidor falso para las pruebas de componentes y
// hooks que escuchan `useServerEvent`.
import { afterEach } from '@jest/globals'

/**
 * El canal de avisos del servidor (`GET /events`, SSE sobre `fetch`). Cada
 * conexión abierta queda en `conexiones`; `emitir` escribe un aviso en todas.
 */
export class FakeChannel {
  readonly connections: { url: string; authorization: string | null }[] = []
  private readonly flows = new Set<ReadableStreamDefaultController<Uint8Array>>()
  private status = 200

  /** Las próximas conexiones responden con este estado (p. ej. 401). */
  respondWith(status: number): void {
    this.status = status
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

  readonly fetch = (entry: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers)
    const url = entry instanceof Request ? entry.url : entry.toString()
    this.connections.push({ url, authorization: headers.get('Authorization') })
    if (this.status !== 200) {
      return Promise.resolve(new Response(null, { status: this.status }))
    }
    const flows = this.flows
    const body = new ReadableStream<Uint8Array>({
      start(handler) {
        flows.add(handler)
        options?.signal?.addEventListener('abort', () => {
          flows.delete(handler)
        })
      },
    })
    return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }))
  }
}

const fetchOriginal = window.fetch.bind(window)

/** Reemplaza el canal de avisos por uno falso para la prueba en curso. */
export function noticesChannel(): FakeChannel {
  const channel = new FakeChannel()
  window.fetch = (entry, options) => channel.fetch(entry, options)
  return channel
}

afterEach(() => {
  window.fetch = fetchOriginal
})
