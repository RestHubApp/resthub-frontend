// La última vez que alguien usó RestHub en este navegador, en cualquiera de
// sus pestañas (RFS-29). Todas comparten la misma sesión del servidor: una
// pestaña quieta no debe bloquearla mientras se trabaja en otra.
import { tabStorage } from '@/services/tabStorage'

const LAST_ACTIVITY_KEY = 'resthub.ultimo-uso.v1'
// Tocar la pantalla dispara muchos eventos: se escribe como mucho cada 5 s.
const WRITE_EVERY_MS = 5000

let lastWrite = 0

/** Anota que esta pestaña se acaba de usar, para que las demás lo sepan. */
export function noteActivity(): void {
  const now = Date.now()
  if (now - lastWrite < WRITE_EVERY_MS) return
  lastWrite = now
  try {
    tabStorage.storage?.setItem(LAST_ACTIVITY_KEY, String(now))
  } catch {
    // Sin almacenamiento cada pestaña cuenta solo su propio uso.
  }
}

/** El último uso anotado por cualquier pestaña, en milisegundos; 0 si no se sabe. */
export function lastActivity(): number {
  try {
    const at = Number(tabStorage.storage?.getItem(LAST_ACTIVITY_KEY) ?? 0)
    return Number.isFinite(at) ? at : 0
  } catch {
    return 0
  }
}
