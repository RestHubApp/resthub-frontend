import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'

import { platformRestaurantsQuery } from '@/api/platform'
import type { PlatformRestaurantSummary } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/services/format'
import { paths } from '@/services/paths'
import { PlatformQueryError } from './PlatformQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { MAX_RESTAURANT_SEARCH, pageCount, restaurantListParams, staffSummary } from './restaurantList'
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

function howMany(total: number): string {
  return total === 1 ? '1 restaurante' : `${String(total)} restaurantes`
}

/** Todos los restaurantes de RestHub, los más nuevos primero, con búsqueda por nombre o identificador. */
export function RestaurantsView() {
  const [text, setText] = useState('')
  const [page, setPage] = useState(0)
  const search = useDeferredValue(text)
  const list = useQuery({ ...platformRestaurantsQuery(restaurantListParams(search, page)), placeholderData: keepPreviousData })
  const total = list.data?.total ?? 0
  const pages = pageCount(total)
  const empty = search.trim() === '' ? 'Todavía no hay restaurantes.' : 'Ningún restaurante coincide con la búsqueda.'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Restaurantes"
        description="Los locales que usan RestHub: quién está activo y cuánto personal tiene."
        actions={
          <Button asChild size="lg" className="h-11 px-4">
            <Link to={paths.platform.newRestaurant}>
              <Icon name="agregar" size={18} />
              <span>Nuevo restaurante</span>
            </Link>
          </Button>
        }
      />
      <SectionCard title={list.isSuccess ? howMany(total) : 'Restaurantes'}>
        <Input
          type="search"
          aria-label="Buscar por nombre o identificador"
          placeholder="Buscar por nombre o identificador"
          className="h-11"
          maxLength={MAX_RESTAURANT_SEARCH}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setPage(0)
          }}
        />
        {list.isError ? (
          <PlatformQueryError error={list.error} fallback="No se pudo cargar la lista." onRetry={() => void list.refetch()} />
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list.data?.items ?? []}
            isLoading={list.isPending}
            emptyMessage={empty}
            getRowId={(r) => String(r.id)}
          />
        )}
        {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
