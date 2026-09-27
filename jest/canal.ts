// El canal de avisos del servidor falso para las pruebas de componentes y
// hooks que escuchan `useServerEvent`.
import { afterEach } from '@jest/globals'

/**
 * El canal de avisos del servidor (`GET /events`, SSE sobre `fetch`). Cada
 * conexión abierta queda en `conexiones`; `emitir` escribe un aviso en todas.
 */
export class CanalFalso {
  readonly conexiones: { url: string; autorizacion: string | null }[] = []
  private readonly flujos = new Set<ReadableStreamDefaultController<Uint8Array>>()
  private status = 200

  /** Las próximas conexiones responden con este estado (p. ej. 401). */
  responderCon(status: number): void {
    this.status = status
  }

  emitir(tipo: string, datos: string): void {
    const bloque = new TextEncoder().encode(`event: ${tipo}\ndata: ${datos}\n\n`)
    for (const flujo of this.flujos) {
      flujo.enqueue(bloque)
    }
  }

  /** El servidor corta todas las conexiones abiertas. */
  cortar(): void {
    for (const flujo of this.flujos) {
      flujo.close()
    }
    this.flujos.clear()
  }

  readonly fetch = (entrada: RequestInfo | URL, opciones?: RequestInit): Promise<Response> => {
    const cabeceras = new Headers(opciones?.headers)
    const url = entrada instanceof Request ? entrada.url : entrada.toString()
    this.conexiones.push({ url, autorizacion: cabeceras.get('Authorization') })
    if (this.status !== 200) {
      return Promise.resolve(new Response(null, { status: this.status }))
    }
    const flujos = this.flujos
    const cuerpo = new ReadableStream<Uint8Array>({
      start(controlador) {
        flujos.add(controlador)
        opciones?.signal?.addEventListener('abort', () => {
          flujos.delete(controlador)
        })
      },
    })
    return Promise.resolve(new Response(cuerpo, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }))
  }
}

const fetchOriginal = window.fetch.bind(window)

/** Reemplaza el canal de avisos por uno falso para la prueba en curso. */
export function canalDeAvisos(): CanalFalso {
  const canal = new CanalFalso()
  window.fetch = (entrada, opciones) => canal.fetch(entrada, opciones)
  return canal
}

afterEach(() => {
  window.fetch = fetchOriginal
})
