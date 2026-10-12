import { ShellIcon } from '@/features/shell/ShellIcon'
import type { NavEntry } from '@/features/shell/navigation'

interface BottomBarPreviewProps {
  readonly bar: readonly NavEntry[]
  /** Si sobran pantallas, el último botón es «Más»; si no, «Cuenta». */
  readonly hasRest: boolean
}

/** La barra de abajo del celular en miniatura, como queda con lo elegido. */
export function BottomBarPreview({ bar, hasRest }: BottomBarPreviewProps) {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-1">
      <ul className="m-0 flex list-none gap-1 p-0">
        {bar.map((entry) => (
          <li key={entry.to} className="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground">
            <ShellIcon name={entry.icon} size={20} />
            <span className="max-w-full truncate">{entry.label}</span>
          </li>
        ))}
        <li className="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground">
          <ShellIcon name={hasRest ? 'more' : 'profile'} size={20} />
          <span>{hasRest ? 'Más' : 'Cuenta'}</span>
        </li>
      </ul>
    </div>
  )
}
