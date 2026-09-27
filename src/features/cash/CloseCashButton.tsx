import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { formatCents } from '../../services/format'
import { differenceLabel } from './cashDifference'

interface CloseCashButtonProps {
  readonly pending: boolean
  /** El efectivo esperado en céntimos. */
  readonly expected: number
  /** Contado menos esperado, en céntimos, o `null` si todavía no hay un monto válido. */
  readonly difference: number | null
  readonly onConfirm: () => void
}

/**
 * «Cerrar caja», con su confirmación: cerrar el turno mueve dinero y el
 * arqueo no se cambia después, así que se confirma con el monto contado y la
 * diferencia a la vista.
 */
export default function CloseCashButton({ pending, expected, difference, onConfirm }: CloseCashButtonProps) {
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" size="lg" variant="destructive" className="h-11 px-5" disabled={pending || difference === null}>
          <Icon name="caja" size={18} />
          <span>{pending ? 'Cerrando…' : 'Cerrar caja'}</span>
        </Button>
      }
      title="¿Cerrar la caja?"
      description={`Se cierra el turno con ${formatCents(expected + (difference ?? 0))} contados (${differenceLabel(difference ?? 0)}). El arqueo no se puede cambiar después.`}
      confirmLabel="Cerrar caja"
      onConfirm={onConfirm}
    />
  )
}
