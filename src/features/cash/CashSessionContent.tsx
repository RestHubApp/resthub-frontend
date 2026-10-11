import type { UseQueryResult } from '@tanstack/react-query'

import type { CashSession } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { RetryQueryError } from '@/components/RetryQueryError'
import { errorMessage } from '@/services/apiError'
import { CashSummaryView } from './CashSummaryView'

interface CashSessionContentProps {
  readonly shift: UseQueryResult<CashSession>
}

/** El cuerpo de la ventana del turno: cargando, error con reintento, arqueo y nota de cierre. */
export function CashSessionContent({ shift }: CashSessionContentProps) {
  const data = shift.data

  return (
    <>
      {shift.isPending ? <EmptyState title="Cargando el arqueo…" /> : null}
      {shift.isError ? <RetryQueryError message={errorMessage(shift.error, 'No se pudo cargar el turno.')} onRetry={() => { void shift.refetch() }} /> : null}
      {data?.summary ? <CashSummaryView session={data} summary={data.summary} /> : null}
      {data !== undefined && data.closing_notes !== '' ? <p className="m-0 text-sm">Nota: {data.closing_notes}</p> : null}
    </>
  )
}
