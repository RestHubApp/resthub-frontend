import { FormDialog } from '@/components/FormDialog'
import { StartCountForm } from './StartCountForm'

interface StartCountDialogProps {
  readonly open: boolean
  readonly onClose: () => void
}

/** La ventana para empezar un conteo físico. */
export function StartCountDialog({ open, onClose }: StartCountDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}
      title="Iniciar conteo físico"
      description="Cada insumo se compara con el stock del momento en que lo cuentas: lo que se venda mientras tanto no cuenta como pérdida."
    >
      {open ? <StartCountForm onCancel={onClose} /> : null}
    </FormDialog>
  )
}
