import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paths } from '@/services/paths'
import { MAX_RESTAURANT_SEARCH } from './restaurantList'
import { RestaurantsTable } from './RestaurantsTable'
import { useRestaurantList } from './useRestaurantList'

function howMany(total: number): string {
  return total === 1 ? '1 restaurante' : `${String(total)} restaurantes`
}

/** Todos los restaurantes de RestHub, los más nuevos primero, con búsqueda por nombre o identificador. */
export function RestaurantsView() {
  const { text, changeText, page, setPage, list, total, pages, emptyMessage } = useRestaurantList()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Restaurantes"
        description="Los locales que usan RestHub: quién está activo y cuánto personal tiene."
        actions={
          <Button asChild size="lg" className="h-11 px-4">
            <Link to={paths.platform.newRestaurant}>
              <Icon name="add" size={18} />
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
            changeText(event.target.value)
          }}
        />
        <RestaurantsTable
          items={list.data?.items ?? []}
          isLoading={list.isPending}
          emptyMessage={emptyMessage}
          error={list.isError ? list.error : null}
          onRetry={() => void list.refetch()}
        />
        {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
