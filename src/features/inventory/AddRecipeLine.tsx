import { useId, useState } from 'react'

import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import type { RecipeIngredient } from './recipeMath'
import { baseUnitLabel } from './units'

interface AddRecipeLineProps {
  /** Los insumos que todavía no están en la receta. */
  readonly options: readonly RecipeIngredient[]
  readonly onAdd: (ingredientId: number) => void
}

/** Elegir un insumo y sumarlo a la receta; la cantidad se escribe en su línea. */
export default function AddRecipeLine({ options, onAdd }: AddRecipeLineProps) {
  const id = useId()
  const [elegido, setElegido] = useState('')

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm">
        <Label htmlFor={id}>Agregar insumo</Label>
        <NativeSelect
          id={id}
          className="w-full [&_select]:h-11"
          value={elegido}
          onChange={(evento) => {
            setElegido(evento.target.value)
          }}
        >
          <NativeSelectOption value="">Elige un insumo</NativeSelectOption>
          {options.map((insumo) => (
            <NativeSelectOption key={insumo.id} value={String(insumo.id)}>
              {`${insumo.name} (${baseUnitLabel(insumo.unit)})`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-11 px-4"
        disabled={elegido === ''}
        onClick={() => {
          onAdd(Number(elegido))
          setElegido('')
        }}
      >
        <Icon name="agregar" size={16} />
        <span>Agregar</span>
      </Button>
    </div>
  )
}
