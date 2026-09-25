import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'

interface MoveButtonsProps {
  readonly label: string
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly disabled: boolean
  readonly onMove: (direction: -1 | 1) => void
}

const ICON_BUTTON = 'size-11'

/** Subir y bajar una mesa en el orden en que el mesero las ve. */
export default function MoveButtons({ label, isFirst, isLast, disabled, onMove }: MoveButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="outline" className={ICON_BUTTON} aria-label={`Subir ${label}`} disabled={isFirst || disabled} onClick={() => {
        onMove(-1)
      }}>
        <Icon name="subir" size={18} />
      </Button>
      <Button type="button" variant="outline" className={ICON_BUTTON} aria-label={`Bajar ${label}`} disabled={isLast || disabled} onClick={() => {
        onMove(1)
      }}>
        <Icon name="bajar" size={18} />
      </Button>
    </div>
  )
}
