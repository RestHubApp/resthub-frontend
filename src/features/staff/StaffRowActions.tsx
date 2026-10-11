import { useState } from 'react'

import type { StaffResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { RoleOptionsGate } from './RoleOptionsGate'
import { StaffEditForm } from './StaffEditForm'
import { StaffPasswordForm } from './StaffPasswordForm'
import { StaffStatusButton } from './StaffStatusButton'

interface StaffRowActionsProps {
  readonly account: StaffResponse
  /** La fila es la cuenta de quien esta mirando. */
  readonly isSelf: boolean
  /** Falso si el rol de la cuenta tiene permisos que quien mira no tiene. */
  readonly manageable: boolean
}

type Dialog = 'editar' | 'contrasena' | null

/** Lo que se hace con una cuenta del personal desde el listado. */
export function StaffRowActions({ account, isSelf, manageable }: StaffRowActionsProps) {
  const [dialog, setDialog] = useState<Dialog>(null)
  const close = () => {
    setDialog(null)
  }
  const onChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  if (!manageable) {
    return (
      <p className="m-0 max-w-56 text-sm whitespace-normal text-muted-foreground">
        Su rol tiene permisos que tu cuenta no tiene: no puedes cambiarla.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-1.5 whitespace-normal">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setDialog('editar')
        }}
      >
        <Icon name="editar" size={14} />
        <span>Editar</span>
      </Button>
      {isSelf ? null : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDialog('contrasena')
          }}
        >
          <Icon name="llave" size={14} />
          <span>Contraseña</span>
        </Button>
      )}
      <StaffStatusButton account={account} disabled={isSelf} />

      <FormDialog open={dialog === 'editar'} onOpenChange={onChange} title={`Editar a ${account.full_name}`}>
        <RoleOptionsGate currentRoleId={account.role_id}>
          {(options) => <StaffEditForm account={account} roles={options} isSelf={isSelf} onDone={close} />}
        </RoleOptionsGate>
      </FormDialog>
      <FormDialog
        open={dialog === 'contrasena'}
        onOpenChange={onChange}
        title={`Restablecer la contraseña de ${account.full_name}`}
        description="Tu propia contraseña se cambia en Mi perfil."
      >
        <StaffPasswordForm account={account} onDone={close} />
      </FormDialog>
    </div>
  )
}
