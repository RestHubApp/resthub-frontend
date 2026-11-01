import type { Ingredient, IngredientUnit } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { LineDraft } from './purchaseLines'
import { UnitInput } from './UnitInput'

// Las cantidades de la orden van en la unidad base del insumo, como el libro.
const UNIT_LABELS: Record<IngredientUnit, string> = { g: 'g', ml: 'ml', unit: 'unid.' }

/** Las unidades de la línea a la vista, o nada mientras no se elige el insumo. */
function lineUnits(unit: IngredientUnit | undefined) {
  const label = unit === undefined ? undefined : UNIT_LABELS[unit]
  return { label, costUnit: label === undefined ? undefined : `S/ por ${label}` }
}

interface PurchaseLineEditorProps {
  readonly index: number
  readonly line: LineDraft
  readonly ingredients: readonly Ingredient[]
  readonly onChange: (line: LineDraft) => void
  readonly onRemove: () => void
}

/** Un insumo de la orden: cuál, cuánto (en su unidad base, a la vista) y a cuánto esa unidad. */
export function PurchaseLineEditor({ index, line, ingredients, onChange, onRemove }: PurchaseLineEditorProps) {
  const unit = ingredients.find((ingredient) => String(ingredient.id) === line.ingredientId)?.unit
  const id = `linea-${String(index)}`
  const { label, costUnit } = lineUnits(unit)

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2 rounded-lg p-2 ring-1 ring-input sm:grid-cols-[1fr_8rem_8rem_auto]">
      <NativeSelect
        aria-label={`Insumo de la línea ${String(index + 1)}`}
        className="col-span-2 w-full sm:col-span-1"
        value={line.ingredientId}
        onChange={(event) => {
          onChange({ ...line, ingredientId: event.target.value })
        }}
      >
        <NativeSelectOption value="">Elige un insumo</NativeSelectOption>
        {ingredients.map((ingredient) => (
          <NativeSelectOption key={ingredient.id} value={String(ingredient.id)}>
            {ingredient.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="button" variant="ghost" size="sm" aria-label={`Quitar la línea ${String(index + 1)}`} className="sm:order-last" onClick={onRemove}>
        <Icon glyph={icons.delete} size={16} />
      </Button>
      <UnitInput
        id={`${id}-cantidad`}
        unit={label}
        aria-label={label === undefined ? 'Cantidad' : `Cantidad en ${label}`}
        inputMode="decimal"
        placeholder={label === undefined ? 'Cantidad' : `Cantidad (${label})`}
        value={line.quantity}
        onChange={(event) => {
          onChange({ ...line, quantity: event.target.value })
        }}
      />
      <UnitInput
        id={`${id}-costo`}
        unit={costUnit}
        aria-label={`Costo por ${label ?? 'unidad'}`}
        inputMode="decimal"
        placeholder={costUnit ?? 'S/ por unidad'}
        value={line.unitCost}
        onChange={(event) => {
          onChange({ ...line, unitCost: event.target.value })
        }}
      />
    </li>
  )
}
