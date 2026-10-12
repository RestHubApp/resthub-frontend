import { PERMISSION } from '@/api/permissions'
import { ErrorMessage } from '@/components/ErrorMessage'
import type { Customer } from '@/api/types'
import { useCan, useTimeZone } from '@/store/session'
import { CustomerDetail } from './CustomerDetail'
import { CustomerRights } from './CustomerRights'
import { RevealContact } from './RevealContact'
import type { useRevealContact } from './useRevealContact'

interface CustomerSheetBodyProps {
  /** El cliente ya cargado; `undefined` mientras carga o si falló. */
  readonly customer: Customer | undefined
  readonly error: unknown
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
  /** El «Ver completo» de la ficha; `undefined` si ya se reveló. Solo se ofrece si el servidor enmascaró el contacto. */
  readonly reveal: ReturnType<typeof useRevealContact>['reveal'] | undefined
}

/** El cuerpo de la ficha: el error de carga, el detalle y, con permiso, los derechos ARCO. */
export function CustomerSheetBody({ customer, error, canEdit, onEdit, onClose, reveal }: CustomerSheetBodyProps) {
  const timeZone = useTimeZone()
  const canErase = useCan(PERMISSION.customersErase)

  return (
    <>
      {error === null ? null : <ErrorMessage error={error} fallback="No se pudo cargar." />}
      {customer?.masked === true && reveal !== undefined ? <RevealContact reveal={reveal} /> : null}
      {customer ? <CustomerDetail customer={customer} timeZone={timeZone} canEdit={canEdit} onEdit={() => {
        onEdit(customer)
      }} /> : null}
      {customer && canErase ? <CustomerRights customer={customer} onErased={onClose} /> : null}
    </>
  )
}
