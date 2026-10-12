import { useState } from 'react'

import type { DishMargin } from '@/api/types'
import { DetailSheet } from '@/components/DetailSheet'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { marginHighlights } from './marginHighlights'
import { MarginsTable } from './MarginsTable'

interface MarginsBodyProps {
  readonly dishes: readonly DishMargin[]
}

/** Los platos de mayor y menor margen a la vista, y la tabla con todos en una hoja. */
export function MarginsBody({ dishes }: MarginsBodyProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const shown = marginHighlights(dishes)

  if (dishes.length === 0) {
    return <EmptyState title="No hay platos en la carta." />
  }

  return (
    <div className="flex flex-col gap-3">
      <MarginsTable dishes={shown} />
      {shown.length < dishes.length ? (
        <>
          <p className="m-0 text-sm text-muted-foreground">Se muestran los cinco de mayor margen y los cinco de menor margen.</p>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => {
              setIsSheetOpen(true)
            }}
          >
            {`Ver los ${String(dishes.length)} platos`}
          </Button>
          <DetailSheet
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            title="Margen por plato"
            description="Todos los platos de la carta. Toca una columna para ordenar."
            size="lg"
          >
            <MarginsTable dishes={dishes} />
          </DetailSheet>
        </>
      ) : null}
    </div>
  )
}
