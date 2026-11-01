import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { suppliersQuery } from '@/api/purchasing'
import type { Supplier } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { SupplierDialog } from './SupplierDialog'
import { SuppliersList } from './SuppliersList'

interface SuppliersPanelProps {
  readonly canManage: boolean
}

/** A quién se le compra: los proveedores del local, con su contacto. */
export function SuppliersPanel({ canManage }: SuppliersPanelProps) {
  const suppliers = useQuery(suppliersQuery)
  // `undefined` cerrada; `null` para crear; un proveedor para editarlo.
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined)

  return (
    <SectionCard
      title="Proveedores"
      actions={
        canManage ? (
          <Button type="button" onClick={() => {
            setEditing(null)
          }}>
            <Icon glyph={icons.add} size={16} />
            <span>Nuevo proveedor</span>
          </Button>
        ) : undefined
      }
    >
      <SuppliersList suppliers={suppliers} canManage={canManage} onEdit={setEditing} />
      <SupplierDialog
        open={editing !== undefined}
        supplier={editing ?? null}
        onClose={() => {
          setEditing(undefined)
        }}
      />
    </SectionCard>
  )
}
