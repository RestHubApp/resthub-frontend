import type { MenuItem } from '@/api/types'
import { Button } from '@/components/ui/button'

interface DishSheetDeactivateProps {
  readonly item: MenuItem
  readonly isPending: boolean
  readonly onBack: () => void
  readonly onConfirm: () => void
}

/** La confirmación de sacar un plato de la carta, dentro de la misma hoja. */
export function DishSheetDeactivate({ item, isPending, onBack, onConfirm }: DishSheetDeactivateProps) {
  return (
    <div role="group" aria-labelledby="dish-deactivate-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 id="dish-deactivate-title" className="m-0 text-base font-semibold">
          {`¿Sacar ${item.name} de la carta?`}
        </h3>
        <p className="m-0 text-sm text-muted-foreground">
          El mesero deja de verlo hasta que lo vuelvas a activar. Si solo no hay hoy, usa «Disponible hoy».
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
          Desactivar
        </Button>
      </div>
    </div>
  )
}
