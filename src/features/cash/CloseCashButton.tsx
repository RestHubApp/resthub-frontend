import Icon from '../../components/Icon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { formatCents } from '../../services/format'
import { differenceLabel } from './cashDifference'

interface CloseCashButtonProps {
  readonly pending: boolean
  /** El efectivo esperado en céntimos. */
  readonly expected: number
  /** Contado menos esperado, en céntimos, o `null` si todavía no hay un monto válido. */
  readonly difference: number | null
  /** La confirmación se abre cuando el formulario validó el monto. */
  readonly open: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * «Cerrar caja» (envía el formulario) y su confirmación: cerrar el turno
 * mueve dinero y el arqueo no se cambia después, así que se confirma con el
 * monto contado y la diferencia a la vista. Sin un monto válido, el
 * formulario muestra su error y la confirmación no se abre.
 */
export default function CloseCashButton({ pending, expected, difference, open, onCancel, onConfirm }: CloseCashButtonProps) {
  return (
    <>
      <Button type="submit" size="lg" variant="destructive" className="h-11 px-5" disabled={pending}>
        <Icon name="caja" size={18} />
        <span>{pending ? 'Cerrando…' : 'Cerrar caja'}</span>
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(abierta) => {
          if (!abierta) {
            onCancel()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la caja?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Se cierra el turno con ${formatCents(expected + (difference ?? 0))} contados (${differenceLabel(difference ?? 0)}). El arqueo no se puede cambiar después.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              Cerrar caja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
