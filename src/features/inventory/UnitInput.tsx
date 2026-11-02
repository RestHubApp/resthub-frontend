import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'

type UnitInputProps = Readonly<ComponentProps<typeof Input>> & {
  /** La unidad en que se escribe («g», «S/ por g»), siempre a la vista; nada mientras no se sabe. */
  readonly unit: string | undefined
}

/**
 * Un campo de las órdenes de compra con su unidad debajo.
 *
 * Las órdenes van en la unidad base (gramos, mililitros, unidades) y el resto
 * del inventario en kilos y litros: sin la unidad visible, un «4» pensado en
 * kilos entraría como 4 gramos.
 */
export function UnitInput({ unit, ...props }: UnitInputProps) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <Input {...props} />
      {unit === undefined ? null : (
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          {unit}
        </span>
      )}
    </span>
  )
}
