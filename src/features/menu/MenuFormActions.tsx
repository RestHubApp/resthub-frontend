import { DialogFormActions } from '@/components/DialogFormActions'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface MenuFormActionsProps {
  /** `add` al crear, `confirm` al editar. */
  readonly icon: 'add' | 'confirm'
  readonly submitLabel: string
  readonly isPending: boolean
  readonly onCancel: () => void
}

/** Los botones de los formularios de la carta: cancelar y guardar. */
export function MenuFormActions({ icon, submitLabel, isPending, onCancel }: MenuFormActionsProps) {
  return (
    <DialogFormActions>
      <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" size="lg" className="h-11 px-4" disabled={isPending}>
        <Icon name={icon} size={16} />
        <span>{isPending ? 'Guardando…' : submitLabel}</span>
      </Button>
    </DialogFormActions>
  )
}
