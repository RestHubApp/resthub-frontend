import { useState } from 'react'

import type { StaffResponse } from '../../api/types'
import FormDialog from '../../components/FormDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import RoleOptionsGate from './RoleOptionsGate'
import StaffEditForm from './StaffEditForm'
import StaffPasswordForm from './StaffPasswordForm'
import StaffStatusButton from './StaffStatusButton'

interface StaffRowActionsProps {
  readonly account: StaffResponse
  /** La fila es la cuenta de quien esta mirando. */
  readonly isSelf: boolean
  /** Falso si el rol de la cuenta tiene permisos que quien mira no tiene. */
  readonly manageable: boolean
}

type Dialogo = 'editar' | 'contrasena' | null

/** Lo que se hace con una cuenta del personal desde el listado. */
export default function StaffRowActions({ account, isSelf, manageable }: StaffRowActionsProps) {
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const cerrar = () => {
    setDialogo(null)
  }
  const alCambiar = (abierto: boolean) => {
    if (!abierto) {
      cerrar()
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
          setDialogo('editar')
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
            setDialogo('contrasena')
          }}
        >
          <Icon name="llave" size={14} />
          <span>Contraseña</span>
        </Button>
      )}
      <StaffStatusButton account={account} disabled={isSelf} />

      <FormDialog open={dialogo === 'editar'} onOpenChange={alCambiar} title={`Editar a ${account.full_name}`}>
        <RoleOptionsGate currentRoleId={account.role_id}>
          {(opciones) => <StaffEditForm account={account} roles={opciones} isSelf={isSelf} onDone={cerrar} />}
        </RoleOptionsGate>
      </FormDialog>
      <FormDialog
        open={dialogo === 'contrasena'}
        onOpenChange={alCambiar}
        title={`Restablecer la contraseña de ${account.full_name}`}
        description="Tu propia contraseña se cambia en Mi perfil."
      >
        <StaffPasswordForm account={account} onDone={cerrar} />
      </FormDialog>
    </div>
  )
}
