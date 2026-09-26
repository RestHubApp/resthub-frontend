import { useQuery } from '@tanstack/react-query'

import { customerQuery } from '../../api/customers'
import type { Customer } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { errorMessage } from '../../services/api'
import { useTimeZone } from '../../store/session'
import CustomerDetail from './CustomerDetail'

interface CustomerSheetProps {
  readonly customerId: number | null
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
}

function contacto(customer: Customer): string {
  return [customer.phone, customer.email].filter((dato) => dato !== '').join(' · ') || 'Sin datos de contacto'
}

/** Un cliente: sus datos, cuánto viene y gasta, y sus últimos pedidos. */
export default function CustomerSheet({ customerId, canEdit, onEdit, onClose }: CustomerSheetProps) {
  const timeZone = useTimeZone()
  const cliente = useQuery({ ...customerQuery(customerId ?? 0), enabled: customerId !== null })
  const datos = cliente.data

  return (
    <Sheet open={customerId !== null} onOpenChange={(abierto) => {
      if (!abierto) {
        onClose()
      }
    }}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto p-5 sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle>{datos?.name ?? 'Cliente'}</SheetTitle>
          <SheetDescription>
            {datos ? contacto(datos) : 'Cargando…'}
          </SheetDescription>
        </SheetHeader>
        {cliente.isError ? <FormMessage tone="error">{errorMessage(cliente.error, 'No se pudo cargar.')}</FormMessage> : null}
        {datos ? <CustomerDetail customer={datos} timeZone={timeZone} canEdit={canEdit} onEdit={() => {
          onEdit(datos)
        }} /> : null}
      </SheetContent>
    </Sheet>
  )
}
