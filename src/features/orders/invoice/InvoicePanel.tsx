import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { fetchOrderInvoice, orderInvoiceQueryKey } from '../../../api/billing'
import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useCan } from '../../../store/session'
import InvoiceDialog from './InvoiceDialog'

interface InvoicePanelProps {
  readonly order: OrderResponse
}

const TONO = {
  accepted: 'text-success',
  pending: 'text-warning',
  rejected: 'text-destructive',
  simulated: 'text-muted-foreground',
} as const

/**
 * El comprobante electrónico de un pedido pagado: emitirlo o verlo.
 *
 * Aparece solo con el pedido pagado y para quien puede emitir. Ya emitido,
 * muestra el número, cómo lo recibió SUNAT y el PDF del proveedor.
 */
export default function InvoicePanel({ order }: InvoicePanelProps) {
  const puede = useCan('billing.issue')
  const [emitiendo, setEmitiendo] = useState(false)
  const comprobante = useQuery({
    queryKey: orderInvoiceQueryKey(order.id),
    queryFn: () => fetchOrderInvoice(order.id),
    enabled: puede && order.status === 'paid',
  })
  if (!puede || order.status !== 'paid' || comprobante.isPending) {
    return null
  }
  const emitido = comprobante.data

  if (emitido === null || emitido === undefined) {
    return (
      <>
        <Button type="button" variant="outline" className="self-start" onClick={() => {
          setEmitiendo(true)
        }}>
          <Icon name="receta" size={16} />
          <span>Emitir boleta o factura</span>
        </Button>
        <InvoiceDialog order={order} open={emitiendo} onClose={() => {
          setEmitiendo(false)
        }} />
      </>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-input">
      <span className="font-semibold">{emitido.kind_label} {emitido.code}</span>
      <span className={TONO[emitido.status]}>{emitido.status_label}</span>
      {emitido.pdf_url === '' ? null : (
        <a href={emitido.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline">
          PDF
        </a>
      )}
      <Button asChild variant="ghost" size="sm">
        <Link to={`/comprobantes/${String(emitido.id)}/imprimir`}>
          <Icon name="imprimir" size={14} />
          <span>Imprimir</span>
        </Link>
      </Button>
    </div>
  )
}
