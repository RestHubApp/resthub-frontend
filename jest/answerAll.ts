// Respuestas de MSW para las pruebas del cliente HTTP, que no miran una ruta en
// particular sino qué sale y cómo se trata lo que vuelve. Cada una reemplaza lo
// declarado antes en la misma prueba.
import { HttpResponse, http } from 'msw'

import { mswServer } from './mswServer'

/** Lo que salió hacia el servidor falso. */
export interface Sent {
  readonly method: string
  readonly path: string
  readonly body: string
  readonly authorization: string | null
  readonly requestId: string | null
}

const ANY_API_ROUTE = '*/api/v1/*'

/** Cualquier ruta de `/api/v1` responde ese código y ese cuerpo JSON; lo que sale queda en `sent`. */
export function answerAll(status: number, body: unknown, sent: Sent[] = []): void {
  mswServer.use(
    http.all(ANY_API_ROUTE, async ({ request }) => {
      sent.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: await request.text(),
        authorization: request.headers.get('Authorization'),
        requestId: request.headers.get('X-Request-ID'),
      })
      return HttpResponse.json(body as Record<string, unknown>, { status })
    }),
  )
}

/** Un corte de red: la petición falla sin respuesta. */
export function answerWithNetworkError(): void {
  mswServer.use(http.all(ANY_API_ROUTE, () => HttpResponse.error()))
}

/** Una conexión que no responde: solo termina cuando se aborta su señal. */
export function answerNever(): void {
  mswServer.use(http.all(ANY_API_ROUTE, () => new Promise<never>(() => undefined)))
}
