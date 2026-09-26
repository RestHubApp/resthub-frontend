import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'

import { customerSearchQuery } from '../../api/customers'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import SectionCard from '../../components/SectionCard'
import { Input } from '../../components/ui/input'
import { errorMessage } from '../../services/api'
import CustomerRow from './CustomerRow'

interface CustomerListProps {
  readonly onOpen: (customerId: number) => void
}

function cuantos(total: number): string {
  return total === 1 ? '1 cliente' : `${String(total)} clientes`
}

/** Buscar en la libreta por nombre o teléfono. Muestra los 50 primeros que coinciden. */
export default function CustomerList({ onOpen }: CustomerListProps) {
  const [texto, setTexto] = useState('')
  const busqueda = useDeferredValue(texto.trim())
  const clientes = useQuery(customerSearchQuery(busqueda))
  const lista = clientes.data?.items ?? []
  const vacio = busqueda === '' ? 'Todavía no hay clientes' : 'Nadie coincide con la búsqueda'

  return (
    <SectionCard title={clientes.data ? cuantos(clientes.data.total) : 'Clientes'}>
      <Input
        type="search"
        aria-label="Buscar por nombre o teléfono"
        placeholder="Buscar por nombre o teléfono"
        className="mb-3 h-11"
        value={texto}
        onChange={(event) => {
          setTexto(event.target.value)
        }}
      />
      {clientes.isPending ? <ListSkeleton label="Cargando clientes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {clientes.isError ? <FormMessage tone="error">{errorMessage(clientes.error, 'No se pudieron cargar.')}</FormMessage> : null}
      {clientes.isSuccess && lista.length === 0 ? <EmptyState title={vacio} /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {lista.map((cliente) => (
          <CustomerRow key={cliente.id} customer={cliente} onOpen={() => {
            onOpen(cliente.id)
          }} />
        ))}
      </ul>
    </SectionCard>
  )
}
