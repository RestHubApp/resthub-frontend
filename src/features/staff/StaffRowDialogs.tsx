import type { StaffResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { RoleOptionsGate } from './RoleOptionsGate'
import { StaffEditForm } from './StaffEditForm'
import { StaffPasswordForm } from './StaffPasswordForm'

/** Qué ventana de la fila está abierta: editar la cuenta, restablecer su contraseña o ninguna. */
export type StaffDialog = 'editar' | 'contrasena' | null

interface StaffRowDialogsProps {
  readonly account: StaffResponse
  readonly isSelf: boolean
  readonly dialog: StaffDialog
  readonly onClose: () => void
}

/** Las ventanas de una cuenta del personal: editarla y restablecer su contraseña. */
export function StaffRowDialogs({ account, isSelf, dialog, onClose }: StaffRowDialogsProps) {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <>
      <FormDialog open={dialog === 'editar'} onOpenChange={onChange} title={`Editar a ${account.full_name}`}>
        <RoleOptionsGate currentRoleId={account.role_id}>
          {(options) => <StaffEditForm account={account} roles={options} isSelf={isSelf} onDone={onClose} />}
        </RoleOptionsGate>
      </FormDialog>
      <FormDialog
        open={dialog === 'contrasena'}
        onOpenChange={onChange}
        title={`Restablecer la contraseña de ${account.full_name}`}
        description="Tu propia contraseña se cambia en Mi perfil."
      >
        <StaffPasswordForm account={account} onDone={onClose} />
      </FormDialog>
    </>
  )
}
