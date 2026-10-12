import { useQuery } from '@tanstack/react-query'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { billingSettingsQuery, invoiceQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import { EmptyState } from '@/components/EmptyState'
import { useCan, useTimeZone } from '@/store/session'
import { InvoicePrintPaper } from './InvoicePrintPaper'

/** La hoja del comprobante para la impresora térmica; se imprime sola al abrirla. */
export function InvoicePrintView() {
  const invoiceId = Number(useParams()["invoiceId"])
  const timeZone = useTimeZone()
  const canViewSettings = useCan(PERMISSION.billingManage)
  const invoice = useQuery({ ...invoiceQuery(invoiceId), enabled: Number.isInteger(invoiceId) })
  // Los datos del emisor los ve el encargado; el mesero imprime sin encabezado
  // fiscal, que igual está en el PDF oficial del proveedor.
  const settings = useQuery({ ...billingSettingsQuery, enabled: canViewSettings })
  const isReady = invoice.isSuccess

  useEffect(() => {
    if (isReady) {
      window.print()
    }
  }, [isReady])

  if (invoice.isPending) {
    return <EmptyState title="Preparando el comprobante…" />
  }
  if (invoice.isError) {
    return <ErrorMessage error={invoice.error} fallback="No se pudo cargar el comprobante." />
  }

  return <InvoicePrintPaper invoice={invoice.data} settings={settings.data ?? null} timeZone={timeZone} />
}
