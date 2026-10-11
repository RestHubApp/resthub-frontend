import { useId } from 'react'

import type { Ingredient } from '@/api/types'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { KIND_OPTIONS } from './movementKinds'

interface MovementFiltersProps {
  readonly ingredients: readonly Ingredient[]
  readonly ingredientId: string
  readonly onIngredient: (value: string) => void
  readonly kind: string
  readonly onKind: (value: string) => void
}

/** Filtrar el libro por insumo y por tipo de movimiento. */
export function MovementFilters({
  ingredients,
  ingredientId,
  onIngredient,
  kind,
  onKind,
}: MovementFiltersProps) {
  const insumoId = useId()
  const typeId = useId()

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,18rem)_minmax(0,12rem)]">
      <div className="flex flex-col gap-2">
        <Label htmlFor={insumoId}>Insumo</Label>
        <NativeSelect
          id={insumoId}
          className="w-full [&_select]:h-11"
          value={ingredientId}
          onChange={(event) => {
            onIngredient(event.target.value)
          }}
        >
          <NativeSelectOption value="">Todos los insumos</NativeSelectOption>
          {ingredients.map((ingredient) => (
            <NativeSelectOption key={ingredient.id} value={String(ingredient.id)}>
              {ingredient.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={typeId}>Tipo</Label>
        <NativeSelect
          id={typeId}
          className="w-full [&_select]:h-11"
          value={kind}
          onChange={(event) => {
            onKind(event.target.value)
          }}
        >
          <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
          {KIND_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  )
}
