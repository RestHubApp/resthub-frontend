import { useQuery } from '@tanstack/react-query'

import { obsSecurityAlertsQuery } from '@/api/observability'
import type { SecurityAlert } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { formatDateTime, formatInteger } from '@/services/format'
import { PLATFORM_TIME_ZONE } from '@/features/platform/platformTime'
import { ObsQueryState } from './ObsQueryState'
import type { LiveOptions } from './useObsRefresh'

/** `47 en 15 min (umbral 30)`. */
function alertDetail(alert: SecurityAlert): string {
  return `${formatInteger(alert.count)} en ${String(alert.window_minutes)} min (umbral ${formatInteger(alert.threshold)})`
}

/**
 * Las alertas de seguridad (RFS-31): un pico de accesos fallidos, de bloqueos
 * o de 403 en todos los locales. El servidor las levanta solo; acá se ven
 * las últimas, la más nueva primero.
 */
export function SecurityAlertsSection({ live }: { readonly live: LiveOptions }) {
  const alerts = useQuery({ ...obsSecurityAlertsQuery(), ...live })

  return (
    <SectionCard title="Alertas de seguridad" description="Picos de accesos fallidos, bloqueos o accesos denegados en todos los locales. Horas de Lima.">
      <ObsQueryState query={alerts} errorText="No se pudieron cargar las alertas de seguridad." loadingLabel="Cargando las alertas…" skeletonClassName="h-16 rounded-xl">
        {(rows) => rows.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">Sin picos recientes.</p>
        ) : (
          <ul aria-label="Alertas de seguridad" className="m-0 flex list-none flex-col gap-2 p-0">
            {rows.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border border-destructive/40 px-3 py-2">
                <span className="font-medium">{alert.kind_label}</span>
                <span className="text-sm">{alertDetail(alert)}</span>
                <span className="text-sm text-muted-foreground">{formatDateTime(alert.raised_at, PLATFORM_TIME_ZONE)}</span>
              </li>
            ))}
          </ul>
        )}
      </ObsQueryState>
    </SectionCard>
  )
}
