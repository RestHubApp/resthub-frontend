import type { CountDifference } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/ui/badge'
import { isBigDifference } from './differenceMath'

/** El nombre del insumo y, si la diferencia es grande, un aviso con ícono y texto (no solo color). */
export function DifferenceIngredient({ line }: { readonly line: CountDifference }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{line.ingredient_name}</span>
      {isBigDifference(line) ? (
        <Badge variant="warning">
          <Icon name="notice" size={12} />
          <span>Diferencia grande</span>
        </Badge>
      ) : null}
    </span>
  )
}
