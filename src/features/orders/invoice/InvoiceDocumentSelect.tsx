import type { DocumentType, InvoiceKind } from '@/api/types'
import { FilterSelect } from '@/components/FilterSelect'
import { documentOptions } from './invoiceDocument'

interface InvoiceDocumentSelectProps {
  readonly kind: InvoiceKind
  readonly totalCents: number
  readonly value: DocumentType
  readonly onChange: (type: DocumentType) => void
}

/** El documento del cliente en una boleta; la factura siempre va con RUC y no lo muestra. */
export function InvoiceDocumentSelect({ kind, totalCents, value, onChange }: InvoiceDocumentSelectProps) {
  if (kind !== 'boleta') {
    return null
  }
  return (
    <FilterSelect
      id="comprobante-documento"
      label="Documento del cliente"
      value={value}
      options={documentOptions(kind, totalCents)}
      onChange={(type) => {
        if (type !== '') {
          onChange(type)
        }
      }}
    />
  )
}
