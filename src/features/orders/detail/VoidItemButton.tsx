import type { OrderItemResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

interface VoidItemButtonProps {
  readonly item: OrderItemResponse
  readonly onVoid: () => void
}

/** «Anular», al lado de un plato que ya salió a cocina. */
export function VoidItemButton({ item, onVoid }: VoidItemButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" aria-label={`Anular ${item.name}`} onClick={onVoid}>
      <Icon glyph={icons.cancel} size={16} />
      <span>Anular</span>
    </Button>
  )
}
