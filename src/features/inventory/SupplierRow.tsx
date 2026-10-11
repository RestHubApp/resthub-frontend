import type { Supplier } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface SupplierRowProps {
  readonly supplier: Supplier
  readonly canManage: boolean
  readonly onEdit: () => void
}

/** Un proveedor con su contacto y, a quien puede gestionar, el botón de editar. */
export function SupplierRow({ supplier, canManage, onEdit }: SupplierRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-input">
      <span className="flex flex-col">
        <span className="font-medium">{supplier.name}</span>
        <span className="text-sm text-muted-foreground">
          {[supplier.contact, supplier.phone, supplier.notes].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
        </span>
      </span>
      {canManage ? (
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Icon name="edit" size={14} />
          <span>Editar</span>
        </Button>
      ) : null}
    </li>
  )
}
