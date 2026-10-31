import type { Ingredient } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { PurchaseLineEditor } from './PurchaseLineEditor'
import { emptyLine, type LineDraft } from './purchaseLines'

interface PurchaseLinesListProps {
  readonly lines: readonly LineDraft[]
  readonly ingredients: readonly Ingredient[]
  readonly onChange: (lines: LineDraft[]) => void
}

/** Los insumos de la orden, con quitar y agregar. */
export function PurchaseLinesList({ lines, ingredients, onChange }: PurchaseLinesListProps) {
  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {lines.map((line, index) => (
          <PurchaseLineEditor
            key={line.key}
            index={index}
            line={line}
            ingredients={ingredients}
            onChange={(fresh) => {
              onChange(lines.map((l, i) => (i === index ? fresh : l)))
            }}
            onRemove={() => {
              onChange(lines.filter((_, i) => i !== index))
            }}
          />
        ))}
      </ul>
      <Button type="button" variant="ghost" className="self-start" onClick={() => {
        onChange([...lines, emptyLine()])
      }}>
        <Icon glyph={icons.add} size={16} />
        <span>Agregar insumo</span>
      </Button>
    </>
  )
}
