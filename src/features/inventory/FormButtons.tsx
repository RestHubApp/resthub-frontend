import DialogFormActions from '../../components/DialogFormActions'
import Icon from '../../components/Icon'
import type { IconName } from '../../components/icons'
import { Button } from '../../components/ui/button'

interface FormButtonsProps {
  readonly label: string
  readonly icon: IconName
  readonly pending: boolean
  readonly onCancel: () => void
}

/** Cancelar y la acción principal, al pie de cada formulario del inventario. */
export default function FormButtons({ label, icon, pending, onCancel }: FormButtonsProps) {
  return (
    <DialogFormActions>
      <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" size="lg" className="h-11 px-4" disabled={pending}>
        <Icon name={icon} size={16} />
        <span>{pending ? 'Guardando…' : label}</span>
      </Button>
    </DialogFormActions>
  )
}
