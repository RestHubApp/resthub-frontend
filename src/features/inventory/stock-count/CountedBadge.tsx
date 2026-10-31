import type { StockCountLine } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { formatQuantity } from '@/services/format'
import { unitOf } from './countEntry'

/** «Contado: 2.25 L» o «Pendiente»: con texto e ícono, no solo con el color. */
export function CountedBadge({ line }: { readonly line: StockCountLine }) {
  if (line.counted === null) {
    return (
      <Badge variant="warning">
        <Icon glyph={icons.schedule} size={12} />
        <span>Pendiente</span>
      </Badge>
    )
  }
  return (
    <Badge variant="success">
      <Icon glyph={icons.confirm} size={12} />
      <span>Contado: {formatQuantity(line.counted, unitOf(line))}</span>
    </Badge>
  )
}
