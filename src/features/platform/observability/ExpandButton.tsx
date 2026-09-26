import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import type { DataRowContext } from '../../../components/DataTable'

/** Abre y cierra el detalle de una fila de la tabla. */
export default function ExpandButton({ row }: { readonly row: DataRowContext }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-9" aria-expanded={row.isExpanded} onClick={row.toggleExpanded}>
      <Icon name="expandir" size={14} className={row.isExpanded ? 'rotate-180' : undefined} />
      <span>{row.isExpanded ? 'Ocultar' : 'Ver detalle'}</span>
    </Button>
  )
}
