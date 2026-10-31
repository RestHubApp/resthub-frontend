import { useId, useState, type ReactNode } from 'react'

import { Icon } from './Icon'
import * as icons from './icons'
import { Button } from './ui/button'

interface MoreOptionsProps {
  /** Lo que hay dentro, para que el botón diga qué esconde: «Más opciones» por omisión. */
  readonly label?: string
  /** Lo que ayuda a decidir si abrirlo («Descuento, división y propina»). */
  readonly summary?: string
  /** Lo mantiene abierto aunque se haya cerrado (un campo de adentro tiene un error). */
  readonly isForcedOpen?: boolean
  readonly children: ReactNode
}

/**
 * Un desplegable para lo que no hace falta en el caso común.
 *
 * El contenido sigue montado cuando está cerrado (solo se oculta), para que los
 * campos conserven lo que se escribió y se pueda volver sin perderlo.
 */
export function MoreOptions({ label = 'Más opciones', summary, isForcedOpen = false, children }: MoreOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const regionId = useId()
  const isShown = isOpen || isForcedOpen

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="ghost"
        className="justify-between px-3"
        aria-expanded={isShown}
        aria-controls={regionId}
        onClick={() => {
          setIsOpen(!isShown)
        }}
      >
        <span className="flex flex-col items-start text-left">
          <span>{label}</span>
          {summary === undefined ? null : <span className="text-xs font-normal text-muted-foreground">{summary}</span>}
        </span>
        <Icon glyph={isShown ? icons.up : icons.down} size={18} />
      </Button>
      <div id={regionId} hidden={!isShown} className="flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}
