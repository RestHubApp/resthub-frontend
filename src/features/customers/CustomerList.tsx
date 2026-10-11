import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'

import { customerSearchQuery } from '@/api/customers'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/services/api'
import { CustomerRow } from './CustomerRow'

interface CustomerListProps {
  readonly onOpen: (customerId: number) => void
}

function howMany(total: number): string {
  return total === 1 ? '1 cliente' : `${String(total)} clientes`
}

/** Buscar en la libreta por nombre o teléfono. Muestra los 50 primeros que coinciden. */
export function CustomerList({ onOpen }: CustomerListProps) {
  const [text, setText] = useState('')
  const search = useDeferredValue(text.trim())
  const customers = useQuery(customerSearchQuery(search))
  const list = customers.data?.items ?? []
  const empty = search === '' ? 'Todavía no hay clientes' : 'Nadie coincide con la búsqueda'

  return (
    <SectionCard title={customers.data ? howMany(customers.data.total) : 'Clientes'}>
      <Input
        type="search"
        aria-label="Buscar por nombre o teléfono"
        placeholder="Buscar por nombre o teléfono"
        className="mb-3 h-11"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
        }}
      />
      {customers.isPending ? <ListSkeleton label="Cargando clientes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {customers.isError ? <RetryQueryError message={errorMessage(customers.error, 'No se pudieron cargar los clientes.')} onRetry={() => { void customers.refetch() }} /> : null}
      {customers.isSuccess && list.length === 0 ? <EmptyState title={empty} /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((customer) => (
          <CustomerRow key={customer.id} customer={customer} onOpen={() => {
            onOpen(customer.id)
          }} />
        ))}
      </ul>
    </SectionCard>
  )
}
