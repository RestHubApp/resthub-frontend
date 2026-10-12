import { Suspense } from 'react'

import { lazyNamed } from '@/components/lazyNamed'
import { DeferredSection } from './DeferredSection'
import type { ObsFilters } from './obsFilters'
import type { LiveOptions } from './useObsRefresh'

const RoutesSection = lazyNamed(() => import('./RoutesSection'), 'RoutesSection')
const LogsSection = lazyNamed(() => import('./LogsSection'), 'LogsSection')
const RequestsSection = lazyNamed(() => import('./RequestsSection'), 'RequestsSection')

interface DeferredPanelsProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
  readonly live: LiveOptions
}

/** Las secciones pesadas (rutas, logs y peticiones), que se cargan cuando se necesitan. */
export function DeferredPanels({ filters, onChange, live }: DeferredPanelsProps) {
  return (
    <>
      <DeferredSection name="Rutas del API">
        <Suspense fallback={<p role="status">Cargando las rutas…</p>}>
          <RoutesSection filters={filters} live={live} />
        </Suspense>
      </DeferredSection>
      <DeferredSection name="Logs" anchor="logs">
        <Suspense fallback={<p role="status">Cargando los logs…</p>}>
          <LogsSection filters={filters} onChange={onChange} live={live} />
        </Suspense>
      </DeferredSection>
      <DeferredSection name="Peticiones" anchor="peticiones">
        <Suspense fallback={<p role="status">Cargando las peticiones…</p>}>
          <RequestsSection filters={filters} onChange={onChange} live={live} />
        </Suspense>
      </DeferredSection>
    </>
  )
}
