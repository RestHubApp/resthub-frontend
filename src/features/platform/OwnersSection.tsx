import { useState } from 'react'

import type { PlatformRestaurantDetail } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { SectionCard } from '@/components/SectionCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { AddOwnerForm } from './AddOwnerForm'

interface OwnersSectionProps {
  readonly restaurant: PlatformRestaurantDetail
}

/**
 * Las cuentas con el rol Encargado del restaurante.
 *
 * Desde acá solo se agregan: el resto del personal, y editar o desactivar a
 * un encargado, lo hace el propio local desde «Personal».
 */
export function OwnersSection({ restaurant }: OwnersSectionProps) {
  const [adding, setAdding] = useState(false)

  return (
    <SectionCard
      title="Encargados"
      description="Quienes administran el local, con todos sus permisos."
      actions={
        <Button
          type="button"
          size="lg"
          className="h-11 px-4"
          onClick={() => {
            setAdding(true)
          }}
        >
          <Icon name="add" size={18} />
          <span>Agregar encargado</span>
        </Button>
      }
    >
      {restaurant.owners.length === 0 ? (
        <EmptyState title="Este restaurante no tiene encargados." description="Agrega uno para que alguien pueda administrarlo." />
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y p-0">
          {restaurant.owners.map((owner) => (
            <li key={owner.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="font-medium break-words">{owner.full_name}</span>
                <span className="text-sm break-all text-muted-foreground">{owner.email}</span>
              </span>
              <StatusBadge
                label={owner.is_active ? 'Activa' : 'Inactiva'}
                tone={owner.is_active ? 'completed' : undefined}
              />
            </li>
          ))}
        </ul>
      )}
      <FormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Agregar encargado"
        description={`Una cuenta más con el rol Encargado de ${restaurant.name}.`}
        size="lg"
      >
        <AddOwnerForm
          restaurantId={restaurant.id}
          onDone={() => {
            setAdding(false)
          }}
        />
      </FormDialog>
    </SectionCard>
  )
}
