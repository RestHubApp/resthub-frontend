import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { Direction } from './menuOrder'

interface DishOrderButtonsProps {
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/** Subir y bajar el plato en el orden en que lo ve el mesero. */
export function DishOrderButtons({ isFirst, isLast, onMove }: DishOrderButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isFirst}
        onClick={() => {
          onMove('up')
        }}
      >
        <Icon glyph={icons.up} size={16} />
        <span>Subir</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isLast}
        onClick={() => {
          onMove('down')
        }}
      >
        <Icon glyph={icons.down} size={16} />
        <span>Bajar</span>
      </Button>
    </div>
  )
}
