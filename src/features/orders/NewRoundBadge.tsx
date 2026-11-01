import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'

/** «Nuevo», con icono y texto: lo agregado en la última ronda no se distingue solo por el color. */
export function NewRoundBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
      <Icon glyph={icons.add} size={14} />
      Nuevo
    </span>
  )
}
