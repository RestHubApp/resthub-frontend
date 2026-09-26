import type { DocumentType } from '../../../api/types'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

export interface CustomerValues {
  readonly numero: string
  readonly nombre: string
  readonly direccion: string
}

interface CustomerFieldsProps {
  readonly documentType: DocumentType
  readonly withAddress: boolean
  readonly values: CustomerValues
  readonly onChange: (values: CustomerValues) => void
}

/** Documento, nombre y, en una factura, dirección del cliente. «Clientes varios» no pide nada. */
export default function CustomerFields({ documentType, withAddress, values, onChange }: CustomerFieldsProps) {
  const ruc = documentType === 'ruc'

  return (
    <>
      {documentType === 'none' ? null : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante-numero">{ruc ? 'RUC' : 'Número de documento'}</Label>
            <Input id="comprobante-numero" inputMode="numeric" value={values.numero} onChange={(e) => {
              onChange({ ...values, numero: e.target.value })
            }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante-nombre">{ruc ? 'Razón social' : 'Nombre'}</Label>
            <Input id="comprobante-nombre" value={values.nombre} onChange={(e) => {
              onChange({ ...values, nombre: e.target.value })
            }} />
          </div>
        </div>
      )}
      {withAddress ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comprobante-direccion">Dirección fiscal (opcional)</Label>
          <Input id="comprobante-direccion" value={values.direccion} onChange={(e) => {
            onChange({ ...values, direccion: e.target.value })
          }} />
        </div>
      ) : null}
    </>
  )
}
