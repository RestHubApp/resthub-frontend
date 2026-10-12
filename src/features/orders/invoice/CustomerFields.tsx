import type { DocumentType } from '@/api/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DocumentNumberField } from './DocumentNumberField'
import { customerComplete } from './invoiceDocument'

interface CustomerValues {
  readonly number: string
  readonly name: string
  readonly address: string
}

interface CustomerFieldsProps {
  readonly documentType: DocumentType
  readonly withAddress: boolean
  readonly values: CustomerValues
  readonly onChange: (values: CustomerValues) => void
}

/**
 * Documento, nombre y, en una factura, dirección del cliente. «Clientes varios» no pide nada.
 *
 * Mientras falte el número o el nombre, dice qué falta: el botón de emitir espera.
 */
export function CustomerFields({ documentType, withAddress, values, onChange }: CustomerFieldsProps) {
  const isRuc = documentType === 'ruc'

  return (
    <>
      {documentType === 'none' ? null : (
        <div className="grid gap-3 sm:grid-cols-2">
          <DocumentNumberField
            documentType={documentType}
            value={values.number}
            onChange={(number) => {
              onChange({ ...values, number })
            }}
            onFound={(found) => {
              // Solo rellena los campos: siguen editables y nada se guarda hasta emitir.
              onChange({ ...values, name: found.name, address: found.address ?? values.address })
            }}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante-nombre">{isRuc ? 'Razón social' : 'Nombre'}</Label>
            <Input id="comprobante-nombre" value={values.name} onChange={(e) => {
              onChange({ ...values, name: e.target.value })
            }} />
          </div>
        </div>
      )}
      {customerComplete(documentType, values.number, values.name) ? null : (
        <p className="m-0 text-sm text-muted-foreground">
          {isRuc ? 'Escribe el RUC y la razón social' : 'Escribe el número de documento y el nombre'} del cliente para emitir.
        </p>
      )}
      {withAddress ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comprobante-direccion">Dirección fiscal (opcional)</Label>
          <Input id="comprobante-direccion" value={values.address} onChange={(e) => {
            onChange({ ...values, address: e.target.value })
          }} />
        </div>
      ) : null}
    </>
  )
}
