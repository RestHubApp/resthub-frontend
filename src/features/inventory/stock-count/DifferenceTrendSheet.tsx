import { useQuery } from '@tanstack/react-query'

import { ingredientCountHistoryQuery } from '@/api/stockCounts'
import type { CountDifference } from '@/api/types'
import { DetailSheet } from '@/components/DetailSheet'
import { EmptyState } from '@/components/EmptyState'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useTimeZone } from '@/store/session'
import { DifferenceTrend } from './DifferenceTrend'

interface DifferenceTrendSheetProps {
  /** El insumo elegido en el reporte; `null` con la hoja cerrada. */
  readonly line: CountDifference | null
  readonly onClose: () => void
}

/** Si la diferencia de un insumo se repite conteo tras conteo, en una hoja junto al reporte. */
export function DifferenceTrendSheet({ line, onClose }: DifferenceTrendSheetProps) {
  const timeZone = useTimeZone()
  const history = useQuery({ ...ingredientCountHistoryQuery(line?.ingredient_id ?? 0), enabled: line !== null })

  return (
    <DetailSheet
      open={line !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}
      title={line === null ? 'Tendencia' : `Tendencia: ${line.ingredient_name}`}
      description="Una diferencia que se repite apunta a algo de fondo: porciones, robo o una receta mal cargada."
      size="lg"
    >
      {history.isPending ? <EmptyState title="Cargando los conteos…" /> : null}
      <ErrorMessage isError={history.isError} error={history.error} fallback="No se pudo cargar la tendencia." />
      {history.data === undefined ? null : <DifferenceTrend history={history.data} timeZone={timeZone} />}
    </DetailSheet>
  )
}
