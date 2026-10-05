// Lector de Server-Sent Events sobre `fetch`.
//
// No usa `EventSource`, el lector del navegador, porque no permite mandar la
// cabecera `Authorization`: la alternativa seria poner el token en la URL, y la
// URL queda escrita en los logs del servidor y de cualquier proxy.

export interface StreamEvent {
  readonly type: string
  readonly data: string
}

export class EventStreamError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`El canal de avisos respondio ${String(status)}.`)
    this.name = 'EventStreamError'
    this.status = status
  }
}

interface ReadEventStreamOptions {
  readonly url: string
  readonly token: string
  readonly signal: AbortSignal
  readonly onEvent: (event: StreamEvent) => void
}

function despachar(bloque: string, onEvent: (event: StreamEvent) => void): void {
  let type = 'message'
  const data: string[] = []
  for (const linea of bloque.split('\n')) {
    // Una linea que empieza con ":" es un comentario: el servidor los usa de
    // ping para que un proxy no corte la conexion por inactividad.
    if (linea.startsWith('event:')) {
      type = linea.slice('event:'.length).trim()
    } else if (linea.startsWith('data:')) {
      data.push(linea.slice('data:'.length).trimStart())
    }
  }
  if (data.length > 0) {
    onEvent({ type, data: data.join('\n') })
  }
}

/**
 * Una señal que se aborta cuando se aborta cualquiera de las dos.
 *
 * `AbortSignal.any` no existe antes de Safari 17.4 ni de Chrome 116, y en el
 * celular viejo de un mesero el canal de avisos fallaba al conectar y se
 * quedaba reintentando sin abrir nunca. Ahí se combinan a mano.
 */
export function cualquieraDe(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b])
  }
  const combinada = new AbortController()
  const abortar = (origen: AbortSignal) => () => {
    combinada.abort(origen.reason)
  }
  for (const senal of [a, b]) {
    if (senal.aborted) {
      combinada.abort(senal.reason)
      break
    }
    senal.addEventListener('abort', abortar(senal), { once: true, signal: combinada.signal })
  }
  return combinada.signal
}

/**
 * Lee el canal hasta que el servidor lo cierra o se aborta la senal.
 *
 * Rechaza con `EventStreamError` si el servidor responde con un error, para
 * que quien llama distinga una credencial vencida de un corte de red.
 */
export async function readEventStream({
  url,
  token,
  signal,
  onEvent,
}: ReadEventStreamOptions): Promise<void> {
  // El servidor envía pings cada 15 s. Un proxy/NAT puede dejar el socket
  // medio abierto: fetch nunca termina y el cliente no intenta reconectar.
  const idle = new AbortController()
  const timeout = 35_000
  let timer: ReturnType<typeof setTimeout> | undefined
  const renovar = () => {
    clearTimeout(timer)
    timer = setTimeout(() => { idle.abort() }, timeout)
  }
  renovar()
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      cache: 'no-store',
      signal: cualquieraDe(signal, idle.signal),
    })
    if (!response.ok || response.body === null) {
      throw new EventStreamError(response.status)
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let pendiente = ''
    let terminado = false
    while (!terminado) {
      const { value, done } = await reader.read()
      terminado = done
      if (!done) renovar()
      pendiente += (value ?? '').replaceAll('\r\n', '\n')
      let corte = pendiente.indexOf('\n\n')
      while (corte !== -1) {
        despachar(pendiente.slice(0, corte), onEvent)
        pendiente = pendiente.slice(corte + 2)
        corte = pendiente.indexOf('\n\n')
      }
    }
  } finally {
    clearTimeout(timer)
  }
}
