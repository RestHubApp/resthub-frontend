import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_ADJUSTMENT_REASON } from './discountSchema'

interface CourtesyReasonProps {
  readonly itemName: string
  readonly value: string
  readonly isConfirmDisabled: boolean
  readonly onChange: (value: string) => void
  readonly onConfirm: () => void
}

/** La línea donde se escribe el motivo de la cortesía y se confirma. */
export function CourtesyReason({ itemName, value, isConfirmDisabled, onChange, onConfirm }: CourtesyReasonProps) {
  return (
    <div className="flex gap-2">
      <Input
        aria-label={`Motivo de la cortesía de ${itemName}`}
        placeholder="Error de cocina, cumpleaños…"
        maxLength={MAX_ADJUSTMENT_REASON}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
      <Button type="button" size="sm" disabled={isConfirmDisabled} onClick={onConfirm}>
        Confirmar
      </Button>
    </div>
  )
}
