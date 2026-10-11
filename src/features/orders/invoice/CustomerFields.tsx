import type { DocumentType } from '@/api/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const ruc = documentType === 'ruc'

  return (
    <>
      {documentType === 'none' ? null : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante-numero">{ruc ? 'RUC' : 'Número de documento'}</Label>
            <Input id="comprobante-numero" inputMode="numeric" value={values.number} onChange={(e) => {
              onChange({ ...values, number: e.target.value })
            }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante-nombre">{ruc ? 'Razón social' : 'Nombre'}</Label>
            <Input id="comprobante-nombre" value={values.name} onChange={(e) => {
              onChange({ ...values, name: e.target.value })
            }} />
          </div>
        </div>
      )}
      {customerComplete(documentType, values.number, values.name) ? null : (
        <p className="m-0 text-sm text-muted-foreground">
          {ruc ? 'Escribe el RUC y la razón social' : 'Escribe el número de documento y el nombre'} del cliente para emitir.
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
