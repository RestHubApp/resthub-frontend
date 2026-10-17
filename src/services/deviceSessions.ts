// Cómo se describe una sesión abierta en un dispositivo (RFS-17), en «Mi
// perfil» y en la ficha de una cuenta del personal.
import type { DeviceSession } from '@/api/types'
import { formatDateTime } from './format'

/** Una sesión lista para mostrar: el dispositivo y, debajo, dónde y cuándo se usó. */
export interface DeviceSessionLine {
  /** La referencia pública de la sesión, con la que se cierra. */
  readonly id: string
  readonly device: string
  readonly detail: string
  readonly isCurrent: boolean
}

function placeOf(session: DeviceSession): string {
  const place = [session.city, session.country].filter((part) => part !== '').join(', ')
  return place === '' ? 'Lugar desconocido' : place
}

/** `Chrome en Android` y `Lima, PE · 190.42.17.x · Último uso: 17 oct 2026, 10:30`. */
export function describeDeviceSession(session: DeviceSession, timeZone: string): DeviceSessionLine {
  const lastUse = `Último uso: ${formatDateTime(session.last_seen_at, timeZone)}`
  const detail = [placeOf(session), session.network, lastUse].filter((part) => part !== '').join(' · ')
  return { id: session.id, device: session.device === '' ? 'Dispositivo desconocido' : session.device, detail, isCurrent: session.current }
}
