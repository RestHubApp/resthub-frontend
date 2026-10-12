import { useState } from 'react'

import type { StaffResponse } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { type StaffDialog, StaffRowDialogs } from './StaffRowDialogs'
import { useStaffStatus } from './useStaffStatus'

interface MenuItemsOptions {
  readonly account: StaffResponse
  readonly isSelf: boolean
  readonly open: (dialog: StaffDialog) => void
  readonly activate: () => void
}

/** Contraseña y activar o desactivar: no existen para la cuenta propia. */
function menuItems({ account, isSelf, open, activate }: MenuItemsOptions): ActionsMenuItem[] {
  if (isSelf) {
    return []
  }
  return [
    { label: 'Contraseña', icon: 'key', onSelect: () => { open('contrasena') } },
    account.is_active
      ? { label: 'Desactivar', icon: 'turnOn', onSelect: () => { open('desactivar') }, isDestructive: true }
      : { label: 'Activar', icon: 'turnOn', onSelect: activate },
  ]
}

interface StaffRowActionsProps {
  readonly account: StaffResponse
  /** La fila es la cuenta de quien esta mirando. */
  readonly isSelf: boolean
  /** Falso si el rol de la cuenta tiene permisos que quien mira no tiene. */
  readonly manageable: boolean
}

/**
 * Lo que se hace con una cuenta del personal desde el listado: «Editar» a la
 * vista y el resto (contraseña, activar o desactivar) tras el menú «⋯», para
 * que la fila entre en el celular sin recortar botones.
 *
 * Desactivar se confirma, porque la persona deja de poder entrar en ese mismo
 * momento, quiza a mitad de un turno. Activar no quita nada y va directo. La
 * cuenta propia no se desactiva: quien lo hace se queda afuera.
 */
export function StaffRowActions({ account, isSelf, manageable }: StaffRowActionsProps) {
  const [dialog, setDialog] = useState<StaffDialog>(null)
  const status = useStaffStatus(account)
  const close = () => {
    setDialog(null)
  }

  if (!manageable) {
    return (
      <p className="m-0 max-w-56 text-sm whitespace-normal text-muted-foreground">
        Su rol tiene permisos que tu cuenta no tiene: no puedes cambiarla.
      </p>
    )
  }

  const items = menuItems({
    account,
    isSelf,
    open: setDialog,
    activate: () => {
      status.mutate()
    },
  })

  return (
    <div className="flex flex-col items-start gap-1.5 whitespace-normal">
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDialog('editar')
          }}
        >
          <Icon name="edit" size={14} />
          <span>Editar</span>
        </Button>
        {items.length === 0 ? null : <ActionsMenu label={`Más acciones de ${account.full_name}`} items={items} />}
      </div>
      {status.isError ? <ErrorMessage error={status.error} fallback="No se pudo actualizar la cuenta." /> : null}
      <StaffRowDialogs
        account={account}
        isSelf={isSelf}
        dialog={dialog}
        onClose={close}
        onDeactivate={() => {
          status.mutate()
        }}
      />
    </div>
  )
}
