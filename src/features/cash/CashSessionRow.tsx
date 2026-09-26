import type { CashSession } from '../../api/types'
import { formatDateTime, formatMoney, toCents } from '../../services/format'
import { useTimeZone } from '../../store/session'

interface CashSessionRowProps {
  readonly session: CashSession
  readonly onOpen: (sessionId: number) => void
}

/** El tono de la diferencia: cuadra, sobra o falta. El texto también lo dice. */
function differenceTone(cents: number): string {
  if (cents === 0) {
    return 'text-success'
  }
  return cents > 0 ? 'text-foreground' : 'text-destructive'
}

/** Un turno en el historial: cuándo, quién, y si cuadró. */
export default function CashSessionRow({ session, onOpen }: CashSessionRowProps) {
  const timeZone = useTimeZone()
  const diferencia = session.difference === null ? null : toCents(session.difference)

  return (
    <li>
      <button
        type="button"
        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-3 text-left ring-1 ring-input hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={() => {
          onOpen(session.id)
        }}
      >
        <span className="flex flex-col">
          <span className="font-medium">{formatDateTime(session.opened_at, timeZone)}</span>
          <span className="text-xs text-muted-foreground">
            {session.is_open ? 'Abierta' : `Cerró ${session.closed_by_name ?? ''}`} · abrió {session.opened_by_name}
          </span>
        </span>
        <span className="flex flex-col text-right text-sm">
          <span className="tabular-nums">
            {session.expected_cash === null ? 'En curso' : `Esperado ${formatMoney(session.expected_cash)}`}
          </span>
          {diferencia === null ? null : (
            <span className={`font-semibold tabular-nums ${differenceTone(diferencia)}`}>
              {diferencia === 0 ? 'Cuadró' : `Diferencia ${formatMoney(session.difference ?? '0')}`}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
