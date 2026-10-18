import { useState } from 'react'

import type { PlatformRestaurantDetail } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { AddOwnerForm } from './AddOwnerForm'
import { OwnersList } from './OwnersList'

interface OwnersSectionProps {
  readonly restaurant: PlatformRestaurantDetail
}

/**
 * Las cuentas con el rol Encargado del restaurante.
 *
 * Desde acá se agregan y, si alguno no puede entrar, se le pone una
 * contraseña temporal. El resto del personal, y editar o desactivar a un
 * encargado, lo hace el propio local desde «Personal».
 */
export function OwnersSection({ restaurant }: OwnersSectionProps) {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <SectionCard
      title="Encargados"
      description="Quienes administran el local, con todos sus permisos."
      actions={
        <Button
          type="button"
          onClick={() => {
            setIsAdding(true)
          }}
        >
          <Icon name="add" size={18} />
          <span>Agregar encargado</span>
        </Button>
      }
    >
      <OwnersList restaurantId={restaurant.id} owners={restaurant.owners} />
      <FormDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        title="Agregar encargado"
        description={`Una cuenta más con el rol Encargado de ${restaurant.name}.`}
        size="lg"
      >
        <AddOwnerForm
          restaurantId={restaurant.id}
          onDone={() => {
            setIsAdding(false)
          }}
        />
      </FormDialog>
    </SectionCard>
  )
}
