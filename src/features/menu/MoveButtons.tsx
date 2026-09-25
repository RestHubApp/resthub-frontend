import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import type { Direction } from './menuOrder'

// `aria-disabled` y no `disabled`: al llegar al primer lugar, el botón que se
// acaba de tocar no puede perder el foco, o quien usa teclado vuelve al inicio.
const BOTON = 'size-11 aria-disabled:cursor-not-allowed aria-disabled:opacity-40'

interface MoveButtonsProps {
  /** Lo que se mueve, para el nombre accesible: "Subir Entradas". */
  readonly label: string
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/**
 * Subir y bajar un lugar.
 *
 * Arrastrar se hace mal con el dedo y no se puede con el teclado; dos botones
 * sirven igual en la laptop, en el celular y con lector de pantalla.
 */
export default function MoveButtons({ label, isFirst, isLast, onMove }: MoveButtonsProps) {
  return (
    <div className="flex gap-1" role="group" aria-label={`Orden de ${label}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={BOTON}
        aria-label={`Subir ${label}`}
        aria-disabled={isFirst}
        onClick={() => {
          if (!isFirst) {
            onMove('up')
          }
        }}
      >
        <Icon name="subir" size={18} />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={BOTON}
        aria-label={`Bajar ${label}`}
        aria-disabled={isLast}
        onClick={() => {
          if (!isLast) {
            onMove('down')
          }
        }}
      >
        <Icon name="bajar" size={18} />
      </Button>
    </div>
  )
}
