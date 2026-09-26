import { Link } from 'react-router'

import type { ObsRouteSort, ObsRouteStats } from '../../../api/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { formatInteger, formatMilliseconds } from '../../../services/format'
import { type ObsFilters, requestsOfRoute } from './obsFilters'
import { ROUTE_SORTS } from './routeSort'
import SortHeader from './SortHeader'

interface RoutesTableProps {
  readonly routes: readonly ObsRouteStats[]
  readonly sort: ObsRouteSort
  readonly onSort: (sort: ObsRouteSort) => void
  readonly filters: ObsFilters
}

const NUMERO = 'px-3 py-2 text-right tabular-nums'
const ENLACE =
  'rounded font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

function p95(route: ObsRouteStats): string {
  return route.sampled ? `≈ ${formatMilliseconds(route.p95_ms)}` : formatMilliseconds(route.p95_ms)
}

/**
 * Las rutas por su plantilla (`/api/v1/orders/{order_id}`), con su tráfico,
 * sus errores y sus tiempos. Cada una enlaza a sus peticiones.
 */
export default function RoutesTable({ routes, sort, onSort, filters }: RoutesTableProps) {
  const [peticiones, p95Col, errores] = ROUTE_SORTS
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <caption className="sr-only">Rutas de la ventana, ordenadas por {ROUTE_SORTS.find((s) => s.value === sort)?.label}</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="px-3">Ruta</TableHead>
            <SortHeader column={peticiones.value} label={peticiones.label} sort={sort} onSort={onSort} />
            <SortHeader column={errores.value} label={errores.label} sort={sort} onSort={onSort} />
            <TableHead className="px-3 text-right">p50</TableHead>
            <SortHeader column={p95Col.value} label={p95Col.label} sort={sort} onSort={onSort} />
            <TableHead className="px-3 text-right">Base (media)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route) => (
            <TableRow key={`${route.method} ${route.route}`}>
              <TableCell className="px-3 py-2 whitespace-normal">
                <Link
                  to={{ search: requestsOfRoute(filters, route.route).toString(), hash: 'peticiones' }}
                  className={ENLACE}
                  aria-label={`Ver peticiones de ${route.method} ${route.route}`}
                >
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{route.method}</span>
                  <code className="text-sm break-all">{route.route}</code>
                </Link>
              </TableCell>
              <TableCell className={NUMERO}>{formatInteger(route.requests)}</TableCell>
              <TableCell className={`${NUMERO} ${route.errors_5xx > 0 ? 'font-semibold text-destructive' : ''}`}>
                {formatInteger(route.errors_5xx)}
              </TableCell>
              <TableCell className={NUMERO}>{formatMilliseconds(route.p50_ms)}</TableCell>
              <TableCell className={NUMERO}>{p95(route)}</TableCell>
              <TableCell className={NUMERO}>{formatMilliseconds(route.avg_db_ms)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
