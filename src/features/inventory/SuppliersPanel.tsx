import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { suppliersQuery } from '../../api/purchasing'
import type { Supplier } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import SupplierDialog from './SupplierDialog'

interface SuppliersPanelProps {
  readonly canManage: boolean
}

/** A quién se le compra: los proveedores del local, con su contacto. */
export default function SuppliersPanel({ canManage }: SuppliersPanelProps) {
  const proveedores = useQuery(suppliersQuery)
  // `undefined` cerrada; `null` para crear; un proveedor para editarlo.
  const [editando, setEditando] = useState<Supplier | null | undefined>(undefined)
  const lista = proveedores.data ?? []

  return (
    <SectionCard
      title="Proveedores"
      actions={
        canManage ? (
          <Button type="button" onClick={() => {
            setEditando(null)
          }}>
            <Icon name="agregar" size={16} />
            <span>Nuevo proveedor</span>
          </Button>
        ) : undefined
      }
    >
      {proveedores.isPending ? <ListSkeleton label="Cargando proveedores…" count={3} itemClassName="h-14 rounded-lg" /> : null}
      {proveedores.isError ? (
        <FormMessage tone="error">{errorMessage(proveedores.error, 'No se pudieron cargar los proveedores.')}</FormMessage>
      ) : null}
      {proveedores.isSuccess && lista.length === 0 ? (
        <EmptyState title="Todavía no hay proveedores" description="Da de alta al mercado o distribuidor al que le compras." />
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {lista.map((proveedor) => (
          <li key={proveedor.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-input">
            <span className="flex flex-col">
              <span className="font-medium">{proveedor.name}</span>
              <span className="text-sm text-muted-foreground">
                {[proveedor.contact, proveedor.phone, proveedor.notes].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
              </span>
            </span>
            {canManage ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setEditando(proveedor)
              }}>
                <Icon name="editar" size={14} />
                <span>Editar</span>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <SupplierDialog
        open={editando !== undefined}
        supplier={editando ?? null}
        onClose={() => {
          setEditando(undefined)
        }}
      />
    </SectionCard>
  )
}
