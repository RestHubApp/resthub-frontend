import type { Customer } from '@/api/types'

interface CustomerResultsProps {
  readonly customers: readonly Customer[]
  readonly onPick: (customer: Customer) => void
}

/** Los clientes de la libreta que coinciden con la búsqueda; tocar uno lo elige. */
export function CustomerResults({ customers, onPick }: CustomerResultsProps) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {customers.map((customer) => (
        <li key={customer.id}>
          <button
            type="button"
            className="flex min-h-11 w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={() => {
              onPick(customer)
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
  )
}
