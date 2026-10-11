import { FormDialog } from '@/components/FormDialog'
import { RoleOptionsGate } from './RoleOptionsGate'
import { StaffCreateForm } from './StaffCreateForm'

interface StaffCreateDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** La ventana «Nueva cuenta»: el alta de una persona del personal con el rol elegido. */
export function StaffCreateDialog({ open, onOpenChange }: StaffCreateDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva cuenta"
      description="El rol decide qué puede hacer: un mesero toma pedidos desde su celular; un encargado administra el restaurante."
      size="lg"
    >
      <RoleOptionsGate>
        {(options) => (
          <StaffCreateForm
            roles={options}
            onDone={() => {
              onOpenChange(false)
            }}
          />
        )}
      </RoleOptionsGate>
    </FormDialog>
  )
}
