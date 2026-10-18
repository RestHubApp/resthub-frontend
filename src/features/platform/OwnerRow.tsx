import { useState } from 'react'

import type { PlatformOwner } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { ResetOwnerPasswordForm } from './ResetOwnerPasswordForm'

interface OwnerRowProps {
  readonly restaurantId: number
  readonly owner: PlatformOwner
}

/** Un encargado: su estado, si tiene la contraseña temporal, y cómo restablecérsela. */
export function OwnerRow({ restaurantId, owner }: OwnerRowProps) {
  const [isResetting, setIsResetting] = useState(false)
  const close = () => {
    setIsResetting(false)
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <span className="flex min-w-0 flex-col">
        <span className="font-medium break-words">{owner.full_name}</span>
        <span className="text-sm break-all text-muted-foreground">{owner.email}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {owner.must_change_password ? <StatusBadge label="Contraseña temporal" tone="pending" /> : null}
        <StatusBadge label={owner.is_active ? 'Activa' : 'Inactiva'} tone={owner.is_active ? 'completed' : undefined} />
        <Button type="button" size="sm" variant="outline" aria-label={`Restablecer la contraseña de ${owner.full_name}`} onClick={() => { setIsResetting(true) }}>
          <Icon name="key" size={14} />
          <span>Contraseña</span>
        </Button>
      </span>
      <FormDialog
        open={isResetting}
        onOpenChange={setIsResetting}
        title={`Restablecer la contraseña de ${owner.full_name}`}
        description="Para quien olvidó la suya. Díctale la temporal por un canal seguro."
      >
        <ResetOwnerPasswordForm restaurantId={restaurantId} owner={owner} onDone={close} />
      </FormDialog>
    </li>
  )
}
