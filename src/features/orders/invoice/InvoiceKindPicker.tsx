import type { InvoiceKind } from '@/api/types'
import { Button } from '@/components/ui/button'

interface InvoiceKindPickerProps {
  readonly kind: InvoiceKind
  readonly onChange: (kind: InvoiceKind) => void
}

const KINDS = ['boleta', 'factura'] as const

/** Elegir entre boleta y factura. */
export function InvoiceKindPicker({ kind, onChange }: InvoiceKindPickerProps) {
  return (
    <div role="group" aria-label="Tipo de comprobante" className="grid grid-cols-2 gap-2">
      {KINDS.map((option) => (
        <Button
          key={option}
          type="button"
          variant={kind === option ? 'default' : 'outline'}
          aria-pressed={kind === option}
          onClick={() => {
            onChange(option)
          }}
        >
          {option === 'boleta' ? 'Boleta' : 'Factura'}
        </Button>
      ))}
    </div>
  )
}
