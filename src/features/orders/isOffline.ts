import { errorStatus } from '@/services/api'

// El servidor no llegó a atender: el proxy delante responde por él.
const SERVER_UNREACHABLE = new Set([502, 503, 504])

/**
 * Sin respuesta del servidor: no hay señal, se cortó o el servidor no está.
 * Vale reintentar, porque el pedido lleva su id y no se duplica.
 */
export function isOffline(error: unknown): boolean {
  const status = errorStatus(error)
  return status === undefined || SERVER_UNREACHABLE.has(status)
}
