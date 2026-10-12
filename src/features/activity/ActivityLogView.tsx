import { DataTable } from '@/components/DataTable'
import { FilterSelect } from '@/components/FilterSelect'
import { PageHeader } from '@/components/PageHeader'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { useTimeZone } from '@/store/session'
import { activityColumns } from './activityColumns'
import { ACTIVITY_FILTERS } from './activityFilters'
import { useActivityLog } from './useActivityLog'

/**
 * Lo que hizo cada cuenta del restaurante. Con «Accesos a datos de clientes»
 * queda solo quién abrió una ficha, quién vio un dato completo y las alertas
 * por abrir muchas fichas seguidas (Ley N.º 29733). Las horas son las del local.
 */
export function ActivityLogView() {
  const timeZone = useTimeZone()
  const { filter, page, log, total, pageTotal, setFilter, setPage } = useActivityLog()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bitácora" description="Lo que hizo cada cuenta en el restaurante, con su fecha y hora." />
      <SectionCard title="Registro" description={log.isSuccess ? `${String(total)} en total` : undefined}>
        <FilterSelect
          label="Mostrar"
          value={filter}
          options={ACTIVITY_FILTERS}
          allLabel="Todo lo que se hizo"
          className="max-w-xs"
          onChange={setFilter}
        />
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
