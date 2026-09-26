import { Link } from 'react-router'

import type { ObsLogDetail } from '../../../api/types'
import { type ObsFilters, requestsOf } from './obsFilters'
import { prettyFields } from './obsLabels'

const BLOQUE =
  'm-0 max-h-80 overflow-auto rounded-lg bg-card p-3 font-mono text-xs leading-relaxed ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const ENLACE =
  'self-start rounded text-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

interface LogDetailBodyProps {
  readonly entry: ObsLogDetail
  readonly filters: ObsFilters
}

/**
 * Una entrada de log completa: sus campos como JSON con sangría y su
 * traceback en un bloque de ancho fijo que se desplaza.
 *
 * Los dos van como texto dentro de `<pre>`, nunca como HTML: los valores vienen
 * de lo que alguien le mandó al servidor.
 */
export default function LogDetailBody({ entry, filters }: LogDetailBodyProps) {
  const campos = prettyFields(entry.fields)
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm break-words">
        <span className="text-muted-foreground">Logger:</span> <code>{entry.logger}</code>
      </p>
      <section className="flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-sm font-semibold">Campos</h3>
        {campos === null ? (
          <p className="m-0 text-sm text-muted-foreground">El evento no trae campos.</p>
        ) : (
          <pre tabIndex={0} role="region" aria-label="Campos del evento" className={`${BLOQUE} break-words whitespace-pre-wrap`}>
            {campos}
          </pre>
        )}
      </section>
      {entry.traceback === null ? null : (
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="m-0 text-sm font-semibold">Traceback</h3>
          <pre tabIndex={0} role="region" aria-label="Traceback" className={`${BLOQUE} whitespace-pre`}>
            {entry.traceback}
          </pre>
        </section>
      )}
      {entry.request_id === null ? null : (
        <Link to={{ search: requestsOf(filters, entry.request_id).toString(), hash: 'peticiones' }} className={ENLACE}>
          Ver las peticiones de <code>{entry.request_id}</code>
        </Link>
      )}
    </div>
  )
}
