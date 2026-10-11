import { useQuery } from '@tanstack/react-query'

import { cashSessionQuery } from '@/api/cash'
import type { CashSession } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { FormDialog } from '@/components/FormDialog'
import { RetryQueryError } from '@/components/RetryQueryError'
import { errorMessage } from '@/services/api'
import { formatMoney } from '@/services/format'
import { CashSummaryView } from './CashSummaryView'

interface CashSessionDialogProps {
  /** El turno a mostrar; `null` cierra la ventana. */
  readonly sessionId: number | null
  readonly onClose: () => void
}

function countedLabel(session: CashSession | undefined): string | undefined {
  const cash = session?.counted_cash ?? null
  if (cash === null) {
    return undefined
  }
  return `Contado ${formatMoney(cash)} · diferencia ${formatMoney(session?.difference ?? '0')}`
}

/** El arqueo firmado de un turno ya cerrado. */
export function CashSessionDialog({ sessionId, onClose }: CashSessionDialogProps) {
  const shift = useQuery({ ...cashSessionQuery(sessionId ?? 0), enabled: sessionId !== null })
  if (sessionId === null) {
    return null
  }
  const data = shift.data

  return (
    <FormDialog
      open
      size="lg"
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={`Turno de caja ${String(sessionId)}`}
      description={countedLabel(data)}
    >
      {shift.isPending ? <EmptyState title="Cargando el arqueo…" /> : null}
      {shift.isError ? <RetryQueryError message={errorMessage(shift.error, 'No se pudo cargar el turno.')} onRetry={() => { void shift.refetch() }} /> : null}
      {data?.summary ? <CashSummaryView session={data} summary={data.summary} /> : null}
      {data !== undefined && data.closing_notes !== '' ? <p className="m-0 text-sm">Nota: {data.closing_notes}</p> : null}
    </FormDialog>
  )
}
