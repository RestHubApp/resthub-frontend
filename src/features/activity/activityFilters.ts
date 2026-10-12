import type { ActivityKind, ActivityParams } from '@/api/types'
import { ACTIVITY_ACCESS_FILTER } from '@/services/paths'

/** Los movimientos que tocan datos personales de clientes: abrir su ficha, verlos completos, exportarlos y las alertas. */
const ACCESS_KINDS: readonly ActivityKind[] = ['customer_viewed', 'customer_revealed', 'customer_exported', 'data_access_alert']
const CONSENT_KINDS: readonly ActivityKind[] = ['terms_accepted', 'privacy_accepted']

export const ACTIVITY_FILTERS = [
  { value: ACTIVITY_ACCESS_FILTER, label: 'Accesos a datos de clientes', kinds: ACCESS_KINDS },
  { value: 'consentimientos', label: 'Consentimientos del personal', kinds: CONSENT_KINDS },
] as const

export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]['value']

/** El filtro que nombra la dirección, o `''` (sin filtro) si no existe. */
export function filterOf(value: string | null): ActivityFilter | '' {
  return ACTIVITY_FILTERS.find((filter) => filter.value === value)?.value ?? ''
}

/** Los parámetros de la consulta para un filtro y una página (desde cero). */
export function activityParamsOf(filter: ActivityFilter | '', page: number, pageSize: number): ActivityParams {
  const kinds = ACTIVITY_FILTERS.find((entry) => entry.value === filter)?.kinds
  return {
    limit: pageSize,
    offset: page * pageSize,
    ...(kinds === undefined ? {} : { kind: [...kinds] }),
  }
}
