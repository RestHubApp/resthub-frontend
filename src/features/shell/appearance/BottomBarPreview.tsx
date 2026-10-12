import { ShellIcon } from '@/features/shell/ShellIcon'
import type { NavEntry } from '@/features/shell/navigation'
import { BOTTOM_BAR_SLOTS } from '@/services/appearanceRules'

interface BottomBarPreviewProps {
  readonly bar: readonly NavEntry[]
  /** Si sobran pantallas, el último botón es «Más»; si no, «Cuenta». */
  readonly hasRest: boolean
}

const SLOT = 'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium'

/**
 * La barra de abajo del celular a tamaño real, con sus cuatro lugares y el último
 * botón: así se ve cuántos faltan por llenar. Es solo una muestra de lo que se
 * elige más abajo, por eso el lector de pantalla la salta.
 */
export function BottomBarPreview({ bar, hasRest }: BottomBarPreviewProps) {
  const empty = Array.from({ length: BOTTOM_BAR_SLOTS - bar.length }, (_unused, index) => index)
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-1">
      <ul className="m-0 flex list-none gap-1 p-0">
        {bar.map((entry) => (
          <li key={entry.to} className={`${SLOT} text-foreground`}>
            <ShellIcon name={entry.icon} size={20} />
            <span className="max-w-full truncate">{entry.label}</span>
          </li>
        ))}
        {empty.map((slot) => (
          <li key={`empty-${String(slot)}`} className={`${SLOT} border border-dashed text-muted-foreground`}>
            <span>Libre</span>
          </li>
        ))}
        <li className={`${SLOT} text-muted-foreground`}>
          <ShellIcon name={hasRest ? 'more' : 'profile'} size={20} />
          <span>{hasRest ? 'Más' : 'Cuenta'}</span>
        </li>
      </ul>
    </div>
  )
}
