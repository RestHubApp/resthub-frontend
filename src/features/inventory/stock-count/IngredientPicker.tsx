import { useState } from 'react'

import type { Ingredient } from '@/api/types'
import { Input } from '@/components/ui/input'
import { matchesSearch, plainText } from './countFilter'

interface IngredientPickerProps {
  readonly ingredients: readonly Ingredient[]
  readonly selected: ReadonlySet<number>
  readonly onToggle: (ingredientId: number) => void
}

/** Los insumos activos para elegir qué se cuenta, con un buscador. */
export function IngredientPicker({ ingredients, selected, onToggle }: IngredientPickerProps) {
  const [search, setSearch] = useState('')
  const wanted = plainText(search)
  const visible = ingredients.filter((ingredient) => matchesSearch(ingredient.name, wanted))

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="search"
        aria-label="Buscar insumo para contar"
        placeholder="Buscar insumo"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
        }}
      />
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {selected.size === 1 ? '1 insumo elegido' : `${String(selected.size)} insumos elegidos`}
      </p>
      <ul aria-label="Insumos para elegir" className="m-0 flex list-none flex-col rounded-lg border p-1">
        {visible.map((ingredient) => (
          <li key={ingredient.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted/60">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={selected.has(ingredient.id)}
                onChange={() => {
                  onToggle(ingredient.id)
                }}
              />
              <span>{ingredient.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
