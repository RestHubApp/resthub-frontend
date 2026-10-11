import { useState } from 'react'

import type { StaffResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { type StaffDialog, StaffRowDialogs } from './StaffRowDialogs'
import { StaffStatusButton } from './StaffStatusButton'

interface StaffRowActionsProps {
  readonly account: StaffResponse
  /** La fila es la cuenta de quien esta mirando. */
  readonly isSelf: boolean
  /** Falso si el rol de la cuenta tiene permisos que quien mira no tiene. */
  readonly manageable: boolean
}

/** Lo que se hace con una cuenta del personal desde el listado. */
export function StaffRowActions({ account, isSelf, manageable }: StaffRowActionsProps) {
  const [dialog, setDialog] = useState<StaffDialog>(null)
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
        <Icon name="edit" size={14} />
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
          <Icon name="key" size={14} />
          <span>Contraseña</span>
        </Button>
      )}
      <StaffStatusButton account={account} disabled={isSelf} />

      <StaffRowDialogs account={account} isSelf={isSelf} dialog={dialog} onClose={close} />
    </div>
  )
}
