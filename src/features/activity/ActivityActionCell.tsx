import type { ActivityEntry } from '@/api/types'
import { Icon, type IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'

/** Entrar y salir llevan su icono; el resto se reconoce por su texto. */
const KIND_ICONS: ReadonlyMap<string, IconGlyph> = new Map<string, IconGlyph>([
  ['signed_in', icons.signIn],
  ['signed_out', icons.signOut],
])

/** Lo que se hizo, con el icono de entrar o salir cuando corresponde, y su detalle debajo. */
export function ActivityActionCell({ entry }: { readonly entry: ActivityEntry }) {
  const icon = KIND_ICONS.get(entry.kind)
  return (
    <div className="flex items-start gap-2">
      {icon === undefined ? null : <Icon glyph={icon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" />}
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{entry.kind_label}</span>
        {entry.detail === '' ? null : <span className="text-sm text-muted-foreground">{entry.detail}</span>}
      </div>
    </div>
  )
}
