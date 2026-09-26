import type { BillingSettings, Invoice } from '../../api/types'
import { formatDateTime, formatMoney, formatPercent, toCents } from '../../services/format'

interface InvoiceSheetProps {
  readonly invoice: Invoice
  readonly settings: BillingSettings | null
  readonly timeZone: string
}

const FILA = 'flex justify-between gap-2'

/**
 * La representación impresa del comprobante electrónico, en 80 mm.
 *
 * Lleva lo que SUNAT pide ver: emisor con su RUC, tipo y número, cliente,
 * detalle, base imponible, IGV y total. Si el proveedor ya dio su PDF, ese es
 * el oficial; esta hoja sirve para entregarla en el momento.
 */
export default function InvoiceSheet({ invoice, settings, timeZone }: InvoiceSheetProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {settings === null ? null : (
        <div className="text-center">
          <p className="m-0 text-base font-bold">{settings.legal_name}</p>
          <p className="m-0 text-xs">RUC {settings.ruc}</p>
          <p className="m-0 text-xs">{settings.address}</p>
        </div>
      )}
      <p className="m-0 text-center font-bold uppercase">{invoice.kind_label} electrónica</p>
      <p className="m-0 text-center text-lg font-black">{invoice.code}</p>
      <p className="m-0 text-xs">Fecha: {formatDateTime(invoice.issued_at, timeZone)}</p>
      <p className="m-0 text-xs">
        Cliente: {invoice.customer_name}
        {invoice.customer_document_number === '' ? '' : ` · ${invoice.customer_document_type.toUpperCase()} ${invoice.customer_document_number}`}
      </p>
      <hr className="my-1 border-dashed border-black" />
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {invoice.lines.map((line) => (
          <li key={`${line.description}-${line.unit_price}`} className={FILA}>
            <span>{line.quantity} × {line.description}</span>
            <span className="tabular-nums">{formatMoney(line.total)}</span>
          </li>
        ))}
      </ul>
      <hr className="my-1 border-dashed border-black" />
      {toCents(invoice.discount) > 0 ? (
        <p className={`m-0 ${FILA}`}><span>Descuento</span><span>− {formatMoney(invoice.discount)}</span></p>
      ) : null}
      <p className={`m-0 ${FILA}`}><span>Op. gravada</span><span>{formatMoney(invoice.taxable)}</span></p>
      <p className={`m-0 ${FILA}`}><span>IGV {formatPercent(invoice.igv_rate)}</span><span>{formatMoney(invoice.igv)}</span></p>
      <p className={`m-0 ${FILA} text-base font-bold`}><span>Total</span><span>{formatMoney(invoice.total)}</span></p>
      <p className="m-0 mt-2 text-center text-xs">
        {invoice.status === 'accepted'
          ? 'Representación impresa del comprobante electrónico aceptado por SUNAT.'
          : `Estado: ${invoice.status_label}.`}
      </p>
    </div>
  )
}
