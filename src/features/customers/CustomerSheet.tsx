import { useQuery } from '@tanstack/react-query'

import { customerQuery } from '@/api/customers'
import type { Customer } from '@/api/types'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CustomerSheetBody } from './CustomerSheetBody'

interface CustomerSheetProps {
  readonly customerId: number | null
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
}

function contact(customer: Customer): string {
  return [customer.phone, customer.email].filter((data) => data !== '').join(' · ') || 'Sin datos de contacto'
}

/** Un cliente: sus datos, cuánto viene y gasta, y sus últimos pedidos. */
export function CustomerSheet({ customerId, canEdit, onEdit, onClose }: CustomerSheetProps) {
  const customer = useQuery({ ...customerQuery(customerId ?? 0), enabled: customerId !== null })
  const data = customer.data

  return (
    <Sheet open={customerId !== null} onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto p-5 sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle>{data?.name ?? 'Cliente'}</SheetTitle>
          <SheetDescription>
            {data ? contact(data) : 'Cargando…'}
          </SheetDescription>
        </SheetHeader>
        <CustomerSheetBody
          customer={data}
          error={customer.error}
          canEdit={canEdit}
          onEdit={onEdit}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  )
}
