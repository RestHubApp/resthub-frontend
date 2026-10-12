import { useState } from 'react'

import type { Role } from '@/api/types'
import { Icon } from '@/components/Icon'
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

  useScreenAction('nuevo-rol', () => {
    openSet(null)
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles y permisos"
        description="Qué puede hacer cada persona según su rol. El rol de cada cuenta se elige en Personal."
        actions={
          <Button type="button" onClick={() => {
            openSet(null)
          }}>
            <Icon name="add" size={16} />
            <span>Nuevo rol</span>
          </Button>
        }
      />
      <RoleFormDialog
        role={open ?? null}
        open={open !== undefined}
        onOpenChange={(value) => {
          if (!value) {
            openSet(undefined)
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
