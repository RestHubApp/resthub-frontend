import { Link } from 'react-router'

import type { PlatformRestaurantSummary } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { formatDateTime } from '@/services/format'
import { paths } from '@/services/paths'
import { PlatformQueryError } from './PlatformQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { staffSummary } from './restaurantList'
import { RestaurantStatusBadge } from './RestaurantStatusBadge'

const COLUMNS: DataColumn<PlatformRestaurantSummary>[] = [
  {
    id: 'nombre',
    header: 'Restaurante',
    className: 'whitespace-normal',
    cell: (r) => (
      <Link
        to={paths.platform.restaurant(r.id)}
        className="rounded font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {r.name}
      </Link>
    ),
  },
  { id: 'slug', header: 'Identificador', cell: (r) => <code className="text-sm">{r.slug}</code> },
  { id: 'zona', header: 'Zona horaria', cell: (r) => r.timezone },
  { id: 'personal', header: 'Personal', cell: (r) => staffSummary(r.active_staff_count, r.staff_count) },
  { id: 'estado', header: 'Estado', cell: (r) => <RestaurantStatusBadge active={r.is_active} /> },
  { id: 'alta', header: 'Alta', cell: (r) => formatDateTime(r.created_at, PLATFORM_TIME_ZONE) },
]

interface RestaurantsTableProps {
  readonly items: readonly PlatformRestaurantSummary[]
  readonly isLoading: boolean
  readonly emptyMessage: string
  /** El error de la consulta, si falló. */
  readonly error: Error | null
  readonly onRetry: () => void
}

/** La tabla de restaurantes, o el error con su reintento si la lista no cargó. */
export function RestaurantsTable({ items, isLoading, emptyMessage, error, onRetry }: RestaurantsTableProps) {
  if (error !== null) {
    return <PlatformQueryError error={error} fallback="No se pudo cargar la lista." onRetry={onRetry} />
  }

  return <DataTable label="Restaurantes" columns={COLUMNS} data={items} isLoading={isLoading} emptyMessage={emptyMessage} getRowId={(r) => String(r.id)} />
}
