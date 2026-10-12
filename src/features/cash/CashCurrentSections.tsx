import type { CurrentCash } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { formatDateTime, formatMoney } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { CashClosedPrompt } from './CashClosedPrompt'
import { CashSummaryView } from './CashSummaryView'
import { CloseCashForm } from './CloseCashForm'

interface CashCurrentSectionsProps {
  /** La caja actual; `undefined` mientras carga. */
  readonly current: CurrentCash | undefined
  readonly onClosed: () => void
}

/** Lo que depende del estado de la caja: abrirla si está cerrada, o el turno en curso con su cierre. */
export function CashCurrentSections({ current, onClosed }: CashCurrentSectionsProps) {
  const timeZone = useTimeZone()
  const shift = current?.session ?? null

  return (
    <>
      {current?.is_open === false ? <CashClosedPrompt /> : null}
      {shift?.summary ? (
        <>
          <SectionCard
            title="Turno en curso"
            description={`Abrió ${shift.opened_by_name} el ${formatDateTime(shift.opened_at, timeZone)} con ${formatMoney(shift.opening_amount)}`}
          >
            <CashSummaryView session={shift} summary={shift.summary} />
          </SectionCard>
          <SectionCard title="Cerrar caja" description="Cuenta el efectivo de la caja, propinas en efectivo incluidas.">
            <CloseCashForm session={shift} onClosed={onClosed} />
          </SectionCard>
        </>
      ) : null}
    </>
  )
}
