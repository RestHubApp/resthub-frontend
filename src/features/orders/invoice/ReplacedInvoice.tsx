import { useQuery } from '@tanstack/react-query'

import { invoiceQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import { useCan } from '@/store/session'

/** El servidor da solo el id del anulado: su número se pide aparte. */
export function ReplacedInvoice({ invoiceId }: { readonly invoiceId: number }) {
  // Un comprobante suelto solo se lo da el servidor a quien emite: quien solo
  // revisa ve el texto genérico en vez de un 403.
  const canRead = useCan(PERMISSION.billingIssue)
  const replaced = useQuery({ ...invoiceQuery(invoiceId), enabled: canRead })
  return (
    <p className="m-0 basis-full text-xs text-muted-foreground">
      Reemplaza a {replaced.data?.code ?? 'un comprobante anulado'}
    </p>
  )
}
