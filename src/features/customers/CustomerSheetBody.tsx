import { PERMISSION } from '@/api/permissions'
import type { Customer } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/api'
import { useCan, useTimeZone } from '@/store/session'
import { CustomerDetail } from './CustomerDetail'
import { CustomerRights } from './CustomerRights'

interface CustomerSheetBodyProps {
  /** El cliente ya cargado; `undefined` mientras carga o si falló. */
  readonly customer: Customer | undefined
  readonly error: unknown
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
}

/** El cuerpo de la ficha: el error de carga, el detalle y, con permiso, los derechos ARCO. */
export function CustomerSheetBody({ customer, error, canEdit, onEdit, onClose }: CustomerSheetBodyProps) {
  const timeZone = useTimeZone()
  const canErase = useCan(PERMISSION.customersErase)

  return (
    <>
      {error === null ? null : <FormMessage tone="error">{errorMessage(error, 'No se pudo cargar.')}</FormMessage>}
      {customer ? <CustomerDetail customer={customer} timeZone={timeZone} canEdit={canEdit} onEdit={() => {
        onEdit(customer)
      }} /> : null}
      {customer && canErase ? <CustomerRights customer={customer} onErased={onClose} /> : null}
    </>
  )
}
