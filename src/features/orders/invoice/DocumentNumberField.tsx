import type { DocumentLookup, DocumentType } from '@/api/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DocumentLookupButton } from './DocumentLookupButton'
import { lookupTypeOf } from './documentFormat'

interface DocumentNumberFieldProps {
  readonly documentType: DocumentType
  readonly value: string
  readonly onChange: (number: string) => void
  readonly onFound: (found: DocumentLookup) => void
}

/** El número de documento del cliente y, para un RUC o un DNI, el botón que busca sus datos. */
export function DocumentNumberField({ documentType, value, onChange, onFound }: DocumentNumberFieldProps) {
  const lookupType = lookupTypeOf(documentType)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="comprobante-numero">{documentType === 'ruc' ? 'RUC' : 'Número de documento'}</Label>
      <Input id="comprobante-numero" inputMode="numeric" value={value} onChange={(e) => {
        onChange(e.target.value)
      }} />
      {lookupType === null ? null : <DocumentLookupButton type={lookupType} number={value} onFound={onFound} />}
    </div>
  )
}
