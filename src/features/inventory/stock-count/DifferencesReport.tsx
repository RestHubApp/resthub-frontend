import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { countDifferencesQuery } from '@/api/stockCounts'
import type { CountDifference } from '@/api/types'
import { DataTable } from '@/components/DataTable'
import { RetryQueryError } from '@/components/RetryQueryError'
import { buildDifferenceColumns } from './DifferenceColumns'
import { DifferenceSummary } from './DifferenceSummary'
import { DifferenceTrendSheet } from './DifferenceTrendSheet'

/**
 * Lo que dejó un conteo cerrado: el total valorizado arriba y, debajo, cada
 * insumo contado de la mayor pérdida a la mayor sobra (el orden del servidor).
 * Las diferencias grandes llevan un aviso con ícono y texto.
 */
export function DifferencesReport({ countId }: { readonly countId: number }) {
  const report = useQuery(countDifferencesQuery(countId))
  const [trend, setTrend] = useState<CountDifference | null>(null)
  const columns = useMemo(() => buildDifferenceColumns(setTrend), [])

  if (report.isError) {
    return <RetryQueryError error={report.error} fallback="No se pudieron cargar las diferencias." onRetry={() => { void report.refetch() }} />
  }
  return (
    <section aria-label="Diferencias del conteo" className="flex flex-col gap-4">
      {report.data === undefined ? null : <DifferenceSummary report={report.data} />}
      <DataTable
        label="Diferencias por insumo"
        columns={columns}
        data={report.data?.lines ?? []}
        isLoading={report.isPending}
        emptyMessage="No se contó ningún insumo."
        getRowId={(line) => String(line.ingredient_id)}
      />
      <DifferenceTrendSheet
        line={trend}
        onClose={() => {
          setTrend(null)
        }}
      />
    </section>
  )
}
