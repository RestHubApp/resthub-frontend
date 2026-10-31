import { useState } from 'react'

import type { Role } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useScreenAction } from '@/hooks/useScreenAction'
import { RoleFormDialog } from './RoleFormDialog'
import { RolesListCard } from './RolesListCard'

/**
 * Los roles del restaurante y qué puede hacer cada uno.
 *
 * El encargado y el mesero vienen con el local; los demás (cocina, caja) los
 * arma cada restaurante con los permisos del catálogo.
 */
export function RolesView() {
  // `undefined` cerrada; `null` para crear; un rol para editarlo o verlo.
  const [open, openSet] = useState<Role | null | undefined>(undefined)

  const request = useScreenAction('nuevo-rol')
  // Lo pedido por la dirección abre «Nuevo rol» salvo que ya haya otra hoja abierta.
  const current = open === undefined && request.isRequested ? null : open

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles y permisos"
        description="Qué puede hacer cada persona según su rol. El rol de cada cuenta se elige en Personal."
        actions={
          <Button type="button" onClick={() => {
            openSet(null)
          }}>
            <Icon glyph={icons.add} size={16} />
            <span>Nuevo rol</span>
          </Button>
        }
      />
      <RoleFormDialog
        role={current ?? null}
        open={current !== undefined}
        onOpenChange={(value) => {
          if (!value) {
            openSet(undefined)
            request.clear()
          }
        }}
      />
      <RolesListCard
        onOpen={(role) => {
          openSet(role)
        }}
      />
    </div>
  )
}
