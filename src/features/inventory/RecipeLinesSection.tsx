import type { FieldArrayWithId, FieldErrors, UseFormRegister } from 'react-hook-form'

import { AddRecipeLine } from './AddRecipeLine'
import type { RecipeValues } from './inventorySchema'
import { lineCost, type RecipeIngredient } from './recipeMath'
import { RecipeLineRow } from './RecipeLineRow'

interface RecipeLinesSectionProps {
  readonly fields: readonly FieldArrayWithId<RecipeValues, 'lines'>[]
  readonly lines: RecipeValues['lines']
  readonly catalog: ReadonlyMap<number, RecipeIngredient>
  /** Los insumos que todavía no están en la receta. */
  readonly available: readonly RecipeIngredient[]
  readonly register: UseFormRegister<RecipeValues>
  readonly errors: FieldErrors<RecipeValues>
  readonly canManage: boolean
  readonly onRemove: (index: number) => void
  readonly onAdd: (ingredientId: number) => void
}

/** Los insumos por porción de la receta, con quitar y agregar si se puede gestionar. */
export function RecipeLinesSection({
  fields,
  lines,
  catalog,
  available,
  register,
  errors,
  canManage,
  onRemove,
  onAdd,
}: RecipeLinesSectionProps) {
  return (
    <section aria-labelledby="receta-insumos" className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <h2 id="receta-insumos" className="m-0 font-heading text-lg font-semibold">
        Insumos por porción
      </h2>
      {fields.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">
          Sin insumos. Agrega lo que lleva una porción, en la unidad de cada insumo.
        </p>
      ) : (
        <ul className="m-0 list-none divide-y p-0">
          {fields.map((field, index) => {
            const ingredient = catalog.get(field.ingredient_id)
            return ingredient === undefined ? null : (
              <RecipeLineRow
                key={field.id}
                index={index}
                ingredient={ingredient}
                field={register(`lines.${String(index)}.quantity` as `lines.${number}.quantity`)}
                cost={lineCost(lines[index]?.quantity ?? '', ingredient)}
                error={errors.lines?.[index]?.quantity?.message}
                readOnly={!canManage}
                onRemove={() => {
                  onRemove(index)
                }}
              />
            )
          })}
        </ul>
      )}
      {canManage ? <AddRecipeLine options={available} onAdd={onAdd} /> : null}
    </section>
  )
}
