import type { ActivityGroup, ActivityKind, ActivityParams } from '@/api/types'
import { ACTIVITY_ACCESS_FILTER } from '@/services/paths'

const CONSENT_KINDS: readonly ActivityKind[] = ['terms_accepted', 'privacy_accepted']

interface FilterEntry {
  readonly value: string
  readonly label: string
  readonly groups?: readonly ActivityGroup[]
  readonly kinds?: readonly ActivityKind[]
}

/**
 * Los filtros de la bitácora. Casi todos son una familia de acciones del
 * servidor (`group`); los consentimientos son una lista de tipos (`kind`).
 * «Accesos a datos de clientes» deja solo quién abrió una ficha, quién vio un
 * dato completo y las alertas (Ley N.º 29733).
 */
export const ACTIVITY_FILTERS = [
  { value: 'sesiones', label: 'Entradas y salidas', groups: ['sessions'] },
  { value: 'pedidos', label: 'Pedidos', groups: ['orders'] },
  { value: 'caja', label: 'Caja', groups: ['cash'] },
  { value: ACTIVITY_ACCESS_FILTER, label: 'Accesos a datos de clientes', groups: ['customers_access'] },
  { value: 'inventario', label: 'Inventario', groups: ['inventory'] },
  { value: 'carta', label: 'Carta', groups: ['menu'] },
  { value: 'personal', label: 'Personal', groups: ['staff'] },
  { value: 'consentimientos', label: 'Consentimientos del personal', kinds: CONSENT_KINDS },
] as const satisfies readonly FilterEntry[]

export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]['value']

/** El filtro que nombra la dirección, o `''` (sin filtro) si no existe. */
export function filterOf(value: string | null): ActivityFilter | '' {
  return ACTIVITY_FILTERS.find((filter) => filter.value === value)?.value ?? ''
}

/** La cuenta que nombra la dirección (`?persona=7`), o `null` si falta o no es un número. */
export function personOf(value: string | null): number | null {
  const id = Number(value)
  return value !== null && Number.isInteger(id) && id > 0 ? id : null
}

interface ActivityQuery {
  readonly filter: ActivityFilter | ''
  /** La cuenta cuyos movimientos se piden; `null` es todas las cuentas. */
  readonly person: number | null
  /** La página, desde cero. */
  readonly page: number
  readonly pageSize: number
}

/** Los parámetros de la consulta para un filtro, una persona y una página. */
export function activityParamsOf({ filter, person, page, pageSize }: ActivityQuery): ActivityParams {
  const entry = (ACTIVITY_FILTERS as readonly FilterEntry[]).find((candidate) => candidate.value === filter)
  return {
    limit: pageSize,
    offset: page * pageSize,
    ...(entry?.groups === undefined ? {} : { group: [...entry.groups] }),
    ...(entry?.kinds === undefined ? {} : { kind: [...entry.kinds] }),
    ...(person === null ? {} : { user_id: person }),
  }
}
