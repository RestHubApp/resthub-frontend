import type { Ingredient, IngredientUnit } from '../../api/types'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import type { LineDraft } from './purchaseLines'

// Las cantidades de la orden van en la unidad base del insumo, como el libro.
const UNIT_LABELS: Record<IngredientUnit, string> = { g: 'g', ml: 'ml', unit: 'unid.' }

interface PurchaseLineEditorProps {
  readonly index: number
  readonly line: LineDraft
  readonly ingredients: readonly Ingredient[]
  readonly onChange: (line: LineDraft) => void
  readonly onRemove: () => void
}

/** Un insumo de la orden: cuál, cuánto (en su unidad) y a cuánto la unidad. */
export default function PurchaseLineEditor({ index, line, ingredients, onChange, onRemove }: PurchaseLineEditorProps) {
  const unidad = ingredients.find((ingredient) => String(ingredient.id) === line.ingredientId)?.unit
  const id = `linea-${String(index)}`
  const enUnidad = unidad === undefined ? '' : ` en ${UNIT_LABELS[unidad]}`

  return (
    <li className="grid grid-cols-[1fr_auto] gap-2 rounded-lg p-2 ring-1 ring-input sm:grid-cols-[1fr_8rem_8rem_auto]">
      <NativeSelect
        aria-label={`Insumo de la línea ${String(index + 1)}`}
        className="w-full"
        value={line.ingredientId}
        onChange={(evento) => {
          onChange({ ...line, ingredientId: evento.target.value })
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
        <Icon name="eliminar" size={16} />
      </Button>
      <Input
        id={`${id}-cantidad`}
        aria-label={`Cantidad${enUnidad}`}
        inputMode="decimal"
        placeholder={unidad === undefined ? 'Cantidad' : `Cantidad (${UNIT_LABELS[unidad]})`}
        value={line.quantity}
        onChange={(evento) => {
          onChange({ ...line, quantity: evento.target.value })
        }}
      />
      <Input
        id={`${id}-costo`}
        aria-label="Costo por unidad"
        inputMode="decimal"
        placeholder="S/ por unidad"
        value={line.unitCost}
        onChange={(evento) => {
          onChange({ ...line, unitCost: evento.target.value })
        }}
      />
    </li>
  )
}
