import type { ReservationStatus } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'

/** Un cambio de estado que se ofrece en la fila de una reserva. */
export interface StatusAction {
  readonly status: ReservationStatus
  readonly label: string
  readonly variant: 'default' | 'outline' | 'ghost'
  /** Lo que se pregunta antes de aplicarlo; sin ella, se aplica con un toque. */
  readonly confirm?: { readonly title: (who: string) => string; readonly confirmLabel: string }
}

interface ReservationStatusButtonProps {
  readonly action: StatusAction
  /** A nombre de quién y a qué hora, para la pregunta. */
  readonly who: string
  readonly busy: boolean
  readonly onStatus: (status: ReservationStatus) => void
}

/**
 * El botón de un cambio de estado. Cancelar o marcar que no vinieron no se
 * deshace (la reserva ya no se puede editar y su mesa queda libre): se confirma.
 */
export function ReservationStatusButton({ action, who, busy, onStatus }: ReservationStatusButtonProps) {
  const apply = () => {
    onStatus(action.status)
  }
  const button = (
    <Button type="button" size="sm" variant={action.variant} disabled={busy} onClick={action.confirm === undefined ? apply : undefined}>
      {action.label}
    </Button>
  )
  if (action.confirm === undefined) {
    return button
  }
  return (
    <ConfirmDialog
      trigger={button}
      title={action.confirm.title(who)}
      description="No se puede deshacer: la reserva ya no se podrá editar y su mesa queda libre."
      confirmLabel={action.confirm.confirmLabel}
      cancelLabel="Volver"
      onConfirm={apply}
    />
  )
}
