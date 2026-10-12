import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { moveButtonId } from './moveButtonId'

interface MoveButtonProps {
  readonly path: string
  readonly label: string
  readonly step: -1 | 1
  /** Ya está en el extremo: el botón se queda, con `aria-disabled`, para no soltar el foco. */
  readonly isAtEdge: boolean
  readonly onMove: () => void
}

/** El botón de subir o bajar una pantalla del menú. */
export function MoveButton({ path, label, step, isAtEdge, onMove }: MoveButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      id={moveButtonId(path, step)}
      aria-label={`${step === -1 ? 'Subir' : 'Bajar'} ${label}`}
      aria-disabled={isAtEdge}
      className="aria-disabled:opacity-50"
      onClick={() => {
        if (!isAtEdge) {
          onMove()
        }
      }}
    >
      <Icon name={step === -1 ? 'up' : 'down'} size={18} />
    </Button>
  )
}
