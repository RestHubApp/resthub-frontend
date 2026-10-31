import type { UseQueryResult } from '@tanstack/react-query'

import type { Supplier } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorMessage } from '@/components/ErrorMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { SupplierRow } from './SupplierRow'

interface SuppliersListProps {
  readonly suppliers: UseQueryResult<Supplier[]>
  readonly canManage: boolean
  readonly onEdit: (supplier: Supplier) => void
}

/** Los proveedores del local, con lo que se ve mientras cargan, si fallan o si no hay ninguno. */
export function SuppliersList({ suppliers, canManage, onEdit }: SuppliersListProps) {
  const list = suppliers.data ?? []
  return (
    <>
      {suppliers.isPending ? <ListSkeleton label="Cargando proveedores…" count={3} itemClassName="h-14 rounded-lg" /> : null}
      <ErrorMessage isError={suppliers.isError} error={suppliers.error} fallback="No se pudieron cargar los proveedores." />
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
              onEdit(supplier)
            }}
          />
        ))}
      </ul>
    </>
  )
}
