import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { suppliersQuery } from '@/api/purchasing'
import type { Supplier } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { MutationError } from './MutationError'
import { SupplierDialog } from './SupplierDialog'
import { SupplierRow } from './SupplierRow'

interface SuppliersPanelProps {
  readonly canManage: boolean
}

/** A quién se le compra: los proveedores del local, con su contacto. */
export function SuppliersPanel({ canManage }: SuppliersPanelProps) {
  const suppliers = useQuery(suppliersQuery)
  // `undefined` cerrada; `null` para crear; un proveedor para editarlo.
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined)
  const list = suppliers.data ?? []

  return (
    <SectionCard
      title="Proveedores"
      actions={
        canManage ? (
          <Button type="button" onClick={() => {
            setEditing(null)
          }}>
            <Icon name="add" size={16} />
            <span>Nuevo proveedor</span>
          </Button>
        ) : undefined
      }
    >
      {suppliers.isPending ? <ListSkeleton label="Cargando proveedores…" count={3} itemClassName="h-14 rounded-lg" /> : null}
      <MutationError isError={suppliers.isError} error={suppliers.error} fallback="No se pudieron cargar los proveedores." />
      {suppliers.isSuccess && list.length === 0 ? (
        <EmptyState title="Todavía no hay proveedores" description="Da de alta al mercado o distribuidor al que le compras." />
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((supplier) => (
          <SupplierRow
            key={supplier.id}
            supplier={supplier}
            canManage={canManage}
            onEdit={() => {
              setEditing(supplier)
            }}
          />
        ))}
      </ul>
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
