import { useQuery } from '@tanstack/react-query'

import { cashSessionQuery } from '@/api/cash'
import type { CashSession } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { formatMoney } from '@/services/format'
import { CashSessionContent } from './CashSessionContent'

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
      description={countedLabel(shift.data)}
    >
      <CashSessionContent shift={shift} />
    </FormDialog>
  )
}
