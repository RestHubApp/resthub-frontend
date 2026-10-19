import { useQuery } from '@tanstack/react-query'

import { billingCapabilitiesQuery } from '@/api/billing'
import type { InvoiceKind } from '@/api/types'
import { Button } from '@/components/ui/button'

interface InvoiceKindPickerProps {
  readonly kind: InvoiceKind
  readonly onChange: (kind: InvoiceKind) => void
}

const KINDS = ['boleta', 'factura'] as const

/**
 * Elegir entre boleta y factura. Con el régimen del local en Nuevo RUS la factura
 * no se ofrece; mientras no se sepa el régimen se deja elegir y el servidor decide.
 */
export function InvoiceKindPicker({ kind, onChange }: InvoiceKindPickerProps) {
  const capabilities = useQuery(billingCapabilitiesQuery)
  const isTaxInvoiceAllowed = capabilities.data?.tax_invoice_enabled !== false

  return (
    <div className="flex flex-col gap-2">
    <div role="group" aria-label="Tipo de comprobante" className="grid grid-cols-2 gap-2">
      {KINDS.map((option) => (
        <Button
          key={option}
          type="button"
          variant={kind === option ? 'default' : 'outline'}
          aria-pressed={kind === option}
          disabled={option === 'factura' && !isTaxInvoiceAllowed}
          onClick={() => {
            onChange(option)
          }}
        >
          {option === 'boleta' ? 'Boleta' : 'Factura'}
        </Button>
      ))}
    </div>
      {isTaxInvoiceAllowed ? null : (
        <p className="m-0 text-sm text-muted-foreground">El régimen tributario del local solo permite boletas.</p>
      )}
    </div>
  )
}
