import { useQuery } from '@tanstack/react-query'

import { customerQuery } from '@/api/customers'
import { PERMISSION } from '@/api/permissions'
import type { Customer } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { errorMessage } from '@/services/api'
import { useCan, useTimeZone } from '@/store/session'
import { CustomerDetail } from './CustomerDetail'
import { CustomerRights } from './CustomerRights'

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
  const timeZone = useTimeZone()
  const canErase = useCan(PERMISSION.customersErase)
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
        {customer.isError ? <FormMessage tone="error">{errorMessage(customer.error, 'No se pudo cargar.')}</FormMessage> : null}
        {data ? <CustomerDetail customer={data} timeZone={timeZone} canEdit={canEdit} onEdit={() => {
          onEdit(data)
        }} /> : null}
        {data && canErase ? <CustomerRights customer={data} onErased={onClose} /> : null}
      </SheetContent>
    </Sheet>
  )
}
