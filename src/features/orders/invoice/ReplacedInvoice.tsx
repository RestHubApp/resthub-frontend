import { useQuery } from '@tanstack/react-query'

import { invoiceQuery } from '@/api/billing'

/** El servidor da solo el id del anulado: su número se pide aparte. */
export function ReplacedInvoice({ invoiceId }: { readonly invoiceId: number }) {
  const replaced = useQuery(invoiceQuery(invoiceId))
  return (
    <p className="m-0 basis-full text-xs text-muted-foreground">
      Reemplaza a {replaced.data?.code ?? 'un comprobante anulado'}
    </p>
  )
}
