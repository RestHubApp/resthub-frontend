// Cómo se describe un acceso del historial (RFS-15), en «Mi perfil» y en la
// hoja de una cuenta del personal.
import type { AccessEntry, AccessHistoryPage, AccessOutcome } from '@/api/types'
import { formatDateTime } from './format'

const OUTCOME_LABELS: Readonly<Record<AccessOutcome, string>> = {
  succeeded: 'Correcto',
  failed: 'Fallido',
  throttled: 'Frenado',
  blocked: 'Bloqueado',
}

/** Un acceso listo para mostrar. */
export interface AccessLine {
  readonly id: number
  readonly when: string
  readonly outcome: string
  readonly isSuccess: boolean
  readonly device: string
  readonly detail: string
  /** «Dispositivo nuevo», «País nuevo» y «Fuera de horario» (RFS-32), los que tocan. */
  readonly marks: readonly string[]
}

function placeOf(entry: AccessEntry): string {
  const place = [entry.city, entry.country].filter((part) => part !== '').join(', ')
  return place === '' ? '—' : place
}

function marksOf(entry: AccessEntry): string[] {
  return [
    entry.new_device ? 'Dispositivo nuevo' : '',
    entry.new_country ? 'País nuevo' : '',
    entry.outside_hours ? 'Fuera de horario' : '',
  ].filter((mark) => mark !== '')
}

/** `17 oct 2026, 10:30 · Correcto · Chrome en Android · Lima, PE · 190.42.17.x`. */
export function describeAccess(entry: AccessEntry, timeZone: string): AccessLine {
  return {
    id: entry.id,
    when: formatDateTime(entry.occurred_at, timeZone),
    outcome: OUTCOME_LABELS[entry.outcome],
    isSuccess: entry.outcome === 'succeeded',
    device: entry.device === '' ? 'Dispositivo desconocido' : entry.device,
    detail: [placeOf(entry), entry.network].filter((part) => part !== '').join(' · '),
    marks: marksOf(entry),
  }
}

/**
 * Los accesos de las tandas ya cargadas, sin repetir. Las tandas van por
 * `offset`: si entra un acceso nuevo entre dos, el último de una vuelve como
 * el primero de la siguiente.
 */
export function loadedAccesses(pages: readonly AccessHistoryPage[] | undefined): AccessEntry[] {
  const seen = new Set<number>()
  return (pages ?? []).flatMap((page) => page.items).filter((entry) => {
    if (seen.has(entry.id)) return false
    seen.add(entry.id)
    return true
  })
}
