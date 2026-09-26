import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { billingSettingsQuery, fetchInvoice, invoiceQueryKey } from '../../api/billing'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { PRINT_CSS } from '../../components/printSheet'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { useCan, useTimeZone } from '../../store/session'
import InvoiceSheet from './InvoiceSheet'

/** La hoja del comprobante para la impresora térmica; se imprime sola al abrirla. */
export default function InvoicePrintView() {
  const invoiceId = Number(useParams().invoiceId)
  const timeZone = useTimeZone()
  const veAjustes = useCan('billing.manage')
  const comprobante = useQuery({
    queryKey: invoiceQueryKey(invoiceId),
    queryFn: () => fetchInvoice(invoiceId),
    enabled: Number.isInteger(invoiceId),
  })
  // Los datos del emisor los ve el encargado; el mesero imprime sin encabezado
  // fiscal, que igual está en el PDF oficial del proveedor.
  const ajustes = useQuery({ ...billingSettingsQuery, enabled: veAjustes })
  const listo = comprobante.isSuccess

  useEffect(() => {
    if (listo) {
      window.print()
    }
  }, [listo])

  if (comprobante.isPending) {
    return <EmptyState title="Preparando el comprobante…" />
  }
  if (comprobante.isError) {
    return <FormMessage tone="error">{errorMessage(comprobante.error, 'No se pudo cargar el comprobante.')}</FormMessage>
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{PRINT_CSS}</style>
      <Button type="button" className="print:hidden" onClick={() => {
        window.print()
      }}>
        <Icon name="imprimir" size={16} />
        <span>Imprimir</span>
      </Button>
      <article id="hoja-impresa" className="w-[74mm] bg-white p-3 font-mono text-black shadow-md">
        <InvoiceSheet invoice={comprobante.data} settings={ajustes.data ?? null} timeZone={timeZone} />
      </article>
    </div>
  )
}
