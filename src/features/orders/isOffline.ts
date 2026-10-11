import { isUnreachable } from '@/services/apiError'

/**
 * Sin respuesta del servidor: no hay señal, se cortó o el servidor no está
 * (un servicio caído, o el proxy delante respondiendo por él).
 * Vale reintentar, porque el pedido lleva su id y no se duplica.
 */
export function isOffline(error: unknown): boolean {
  return isUnreachable(error)
}
