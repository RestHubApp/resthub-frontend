import { Button } from '@/components/ui/button'
import { centsToApi, formatCents } from '@/services/format'

interface QuickAmountsProps {
  readonly totalCents: number
  readonly onQuick: (amount: string) => void
}

const BILLS = [50, 100, 200] as const
const CENTS = 100

/** Atajos de monto recibido: el monto exacto y los billetes de siempre que alcanzan. */
export function QuickAmounts({ totalCents, onQuick }: QuickAmountsProps) {
  return (
    <div role="group" aria-label="Montos rápidos" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button
        type="button"
        variant="outline"
        className="h-11"
        onClick={() => {
          onQuick(centsToApi(totalCents))
        }}
      >
        Monto exacto
      </Button>
      {BILLS.map((bill) => (
        <Button
          key={bill}
          type="button"
          variant="outline"
          className="h-11"
          disabled={bill * CENTS < totalCents}
          onClick={() => {
            onQuick(String(bill))
          }}
        >
          {formatCents(bill * CENTS)}
        </Button>
      ))}
    </div>
  )
}
