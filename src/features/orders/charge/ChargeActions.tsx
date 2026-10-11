import { DialogFormActions } from '@/components/DialogFormActions'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface ChargeActionsProps {
  readonly isDisabled: boolean
  readonly isPending: boolean
  readonly onCancel: () => void
}

/** Los botones del cobro: volver y confirmar el pago. */
export function ChargeActions({ isDisabled, isPending, onCancel }: ChargeActionsProps) {
  return (
    <DialogFormActions>
      <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
        Volver
      </Button>
      <Button type="submit" size="lg" variant="success" className="h-11 px-5 text-base" disabled={isDisabled}>
        <Icon name="payment" size={18} />
        <span>{isPending ? 'Cobrando…' : 'Confirmar pago'}</span>
      </Button>
    </DialogFormActions>
  )
}
