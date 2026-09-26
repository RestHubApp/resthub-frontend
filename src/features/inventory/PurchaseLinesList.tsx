import type { Ingredient } from '../../api/types'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import PurchaseLineEditor from './PurchaseLineEditor'
import { emptyLine, type LineDraft } from './purchaseLines'

interface PurchaseLinesListProps {
  readonly lines: readonly LineDraft[]
  readonly ingredients: readonly Ingredient[]
  readonly onChange: (lines: LineDraft[]) => void
}

/** Los insumos de la orden, con quitar y agregar. */
export default function PurchaseLinesList({ lines, ingredients, onChange }: PurchaseLinesListProps) {
  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {lines.map((linea, indice) => (
          <PurchaseLineEditor
            key={linea.key}
            index={indice}
            line={linea}
            ingredients={ingredients}
            onChange={(nueva) => {
              onChange(lines.map((l, i) => (i === indice ? nueva : l)))
            }}
            onRemove={() => {
              onChange(lines.filter((_, i) => i !== indice))
            }}
          />
        ))}
      </ul>
      <Button type="button" variant="ghost" className="self-start" onClick={() => {
        onChange([...lines, emptyLine()])
      }}>
        <Icon name="agregar" size={16} />
        <span>Agregar insumo</span>
      </Button>
    </>
  )
}
