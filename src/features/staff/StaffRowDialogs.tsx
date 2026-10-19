import type { StaffResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { RoleOptionsGate } from './RoleOptionsGate'
import { StaffAccessSheet } from './StaffAccessSheet'
import { StaffDeactivateConfirm } from './StaffDeactivateConfirm'
import { StaffEditForm } from './StaffEditForm'
import { StaffPasswordForm } from './StaffPasswordForm'
import { StaffSessionsSheet } from './StaffSessionsSheet'

/** Qué ventana de la fila está abierta: editar la cuenta, restablecer su contraseña, confirmar la desactivación, sus sesiones o ninguna. */
export type StaffDialog = 'editar' | 'contrasena' | 'desactivar' | 'sesiones' | 'accesos' | null

interface StaffRowDialogsProps {
  readonly account: StaffResponse
  readonly isSelf: boolean
  readonly dialog: StaffDialog
  readonly onClose: () => void
  /** Lo que se hace al confirmar la desactivación, con su motivo. */
  readonly onDeactivate: (reason: string) => void
}

/** Las ventanas de una cuenta del personal: editarla, restablecer su contraseña y confirmar su desactivación. */
export function StaffRowDialogs({ account, isSelf, dialog, onClose, onDeactivate }: StaffRowDialogsProps) {
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
      <StaffDeactivateConfirm account={account} open={dialog === 'desactivar'} onOpenChange={onChange} onDeactivate={onDeactivate} />
      <StaffSessionsSheet account={account} open={dialog === 'sesiones'} onClose={onClose} />
      <StaffAccessSheet account={account} open={dialog === 'accesos'} onClose={onClose} />
    </>
  )
}
