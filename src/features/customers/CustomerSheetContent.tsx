import { useQuery } from '@tanstack/react-query'

import { customerQuery } from '@/api/customers'
import type { Customer, CustomerContact } from '@/api/types'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CustomerSheetBody } from './CustomerSheetBody'
import { useRevealContact } from './useRevealContact'

interface CustomerSheetContentProps {
  readonly customerId: number
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
}

function contact(customer: Customer, revealed: CustomerContact | null): string {
  const shown = revealed ?? customer
  return [shown.phone, shown.email].filter((data) => data !== '').join(' · ') || 'Sin datos de contacto'
}

/** Lo de dentro de la hoja: al cerrarla se desmonta y lo revelado con «Ver completo» se pierde. */
export function CustomerSheetContent({ customerId, canEdit, onEdit, onClose }: CustomerSheetContentProps) {
  const customer = useQuery(customerQuery(customerId))
  const { contact: revealed, reveal } = useRevealContact(customerId)
  const data = customer.data

  return (
    <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto p-5 sm:max-w-md">
      <SheetHeader className="p-0">
        <SheetTitle>{data?.name ?? 'Cliente'}</SheetTitle>
        <SheetDescription>{data ? contact(data, revealed) : 'Cargando…'}</SheetDescription>
      </SheetHeader>
      <CustomerSheetBody
        customer={data}
        error={customer.error}
        canEdit={canEdit}
        onEdit={onEdit}
        onClose={onClose}
        reveal={revealed === null ? reveal : undefined}
      />
    </SheetContent>
  )
}
