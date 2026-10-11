import { differenceLabel } from './cashDifference'

interface CashDifferenceBarProps {
  /** Diferencia en centavos, o `null` mientras el monto no es válido. */
  readonly difference: number | null
}

/** La diferencia entre lo contado y lo esperado, anunciada mientras se escribe. */
export function CashDifferenceBar({ difference }: CashDifferenceBarProps) {
  return (
    <p aria-live="polite" data-testid="cash-difference" className="m-0 flex items-baseline justify-between rounded-lg bg-muted px-4 py-3">
      <span className="font-medium">Diferencia</span>
      <span className="text-xl font-bold tabular-nums">
        {difference === null ? '—' : differenceLabel(difference)}
      </span>
    </p>
  )
}
