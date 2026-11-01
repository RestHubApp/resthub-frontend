import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { DataRowContext } from '@/components/DataTable'

/** Abre y cierra el detalle de una fila de la tabla. */
export function ExpandButton({ row }: { readonly row: DataRowContext }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-9" aria-expanded={row.isExpanded} onClick={row.toggleExpanded}>
      <Icon glyph={icons.expand} size={14} className={row.isExpanded ? 'rotate-180' : undefined} />
      <span>{row.isExpanded ? 'Ocultar' : 'Ver detalle'}</span>
    </Button>
  )
}
