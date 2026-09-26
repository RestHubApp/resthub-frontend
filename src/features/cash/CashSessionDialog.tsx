import { useQuery } from '@tanstack/react-query'

import { cashSessionQueryKey, fetchCashSession } from '../../api/cash'
import type { CashSession } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import { errorMessage } from '../../services/api'
import { formatMoney } from '../../services/format'
import CashSummaryView from './CashSummaryView'

interface CashSessionDialogProps {
  /** El turno a mostrar; `null` cierra la ventana. */
  readonly sessionId: number | null
  readonly onClose: () => void
}

function countedLabel(session: CashSession | undefined): string | undefined {
  const contado = session?.counted_cash ?? null
  if (contado === null) {
    return undefined
  }
  return `Contado ${formatMoney(contado)} · diferencia ${formatMoney(session?.difference ?? '0')}`
}

/** El arqueo firmado de un turno ya cerrado. */
export default function CashSessionDialog({ sessionId, onClose }: CashSessionDialogProps) {
  const turno = useQuery({
    queryKey: cashSessionQueryKey(sessionId ?? 0),
    queryFn: () => fetchCashSession(sessionId ?? 0),
    enabled: sessionId !== null,
  })
  if (sessionId === null) {
    return null
  }
  const datos = turno.data

  return (
    <FormDialog
      open
      size="lg"
      onOpenChange={(abierto) => {
        if (!abierto) {
          onClose()
        }
      }}
      title={`Turno de caja ${String(sessionId)}`}
      description={countedLabel(datos)}
    >
      {turno.isPending ? <EmptyState title="Cargando el arqueo…" /> : null}
      {turno.isError ? <FormMessage tone="error">{errorMessage(turno.error, 'No se pudo cargar el turno.')}</FormMessage> : null}
      {datos?.summary ? <CashSummaryView session={datos} summary={datos.summary} /> : null}
      {datos?.closing_notes ? <p className="m-0 text-sm">Nota: {datos.closing_notes}</p> : null}
    </FormDialog>
  )
}
