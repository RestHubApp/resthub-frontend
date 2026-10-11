import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'

import { customerSearchQuery } from '@/api/customers'
import type { Customer } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Input } from '@/components/ui/input'

const MIN_SEARCH = 3
const MAX_RESULTS = 5

interface CustomerLookupProps {
  readonly onPick: (customer: Customer) => void
}

/**
 * Buscar al cliente en la libreta por nombre o teléfono y llenar sus datos.
 *
 * Es un atajo: el cliente que llama seguido no dicta su dirección cada vez.
 * Si no está, se escriben los datos a mano y el pedido lo agrega solo.
 */
export function CustomerLookup({ onPick }: CustomerLookupProps) {
  const [text, setText] = useState('')
  const search = useDeferredValue(text.trim())
  const isActive = search.length >= MIN_SEARCH
  const customers = useQuery({ ...customerSearchQuery(search), enabled: isActive })
  const found = isActive ? (customers.data?.items ?? []).slice(0, MAX_RESULTS) : []

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="takeaway-lookup" className="text-sm font-medium">
        Buscar cliente frecuente (opcional)
      </label>
      <div className="relative">
        <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="takeaway-lookup"
          type="search"
          value={text}
          placeholder="Nombre o teléfono"
          autoComplete="off"
          className="h-11 pl-9"
          onChange={(event) => {
            setText(event.target.value)
          }}
        />
      </div>
      {found.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {found.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                className="flex min-h-11 w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => {
                  onPick(customer)
                  setText('')
                }}
              >
                <span className="font-medium">{customer.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[customer.phone, customer.address].filter((data) => data !== '').join(' · ') || 'Sin datos de contacto'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {isActive && customers.isSuccess && found.length === 0 ? (
        <p className="m-0 text-xs text-muted-foreground">No está en la libreta: escribe sus datos abajo.</p>
      ) : null}
    </div>
  )
}
