import type { DocumentType, InvoiceKind } from '@/api/types'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="comprobante-documento">Documento del cliente</Label>
      <NativeSelect
        id="comprobante-documento"
        className="w-full"
        value={value}
        onChange={(event) => {
          onChange(event.target.value as DocumentType)
        }}
      >
        {documentOptions(kind, totalCents).map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
