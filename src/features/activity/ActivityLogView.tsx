import { DataTable } from '@/components/DataTable'
import { FilterSelect } from '@/components/FilterSelect'
import { PageHeader } from '@/components/PageHeader'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { PERMISSION } from '@/api/permissions'
import { useCan, useTimeZone } from '@/store/session'
import { activityColumns } from './ActivityColumns'
import { ActivityPersonSelect } from './ActivityPersonSelect'
import { ACTIVITY_FILTERS } from './activityFilters'
import { useActivityLog } from './useActivityLog'

/**
 * Lo que hizo cada cuenta del restaurante: cuándo entra y sale, los pedidos que
 * toma y el resto, por familia de acciones y por persona. Con «Accesos a datos de clientes»
 * queda solo quién abrió una ficha, quién vio un dato completo y las alertas
 * por abrir muchas fichas seguidas (Ley N.º 29733). Las horas son las del local.
 */
export function ActivityLogView() {
  const timeZone = useTimeZone()
  const { filter, person, page, log, total, pageTotal, setFilter, setPerson, setPage } = useActivityLog()
  const canPickPerson = useCan(PERMISSION.staffManage)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bitácora" description="Lo que hizo cada cuenta en el restaurante, con su fecha y hora." />
      <SectionCard title="Registro" description={log.isSuccess ? `${String(total)} en total` : undefined}>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <FilterSelect
            label="Mostrar"
            value={filter}
            options={ACTIVITY_FILTERS}
            allLabel="Todo"
            className="sm:max-w-xs"
            onChange={setFilter}
          />
          {canPickPerson ? <ActivityPersonSelect person={person} onChange={setPerson} /> : null}
        </div>
        {log.isError ? (
          <RetryQueryError error={log.error} fallback="No se pudo cargar la bitácora." onRetry={() => void log.refetch()} />
        ) : (
          <DataTable
            label="Bitácora del restaurante"
            columns={activityColumns(timeZone)}
            data={log.data?.items ?? []}
            isLoading={log.isPending}
            emptyMessage="Todavía no hay nada registrado."
            getRowId={(e) => String(e.id)}
          />
        )}
        {pageTotal > 1 ? <TablePagination actual={page} total={pageTotal} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
