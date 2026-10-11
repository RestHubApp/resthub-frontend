import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { TextField } from '@/components/TextField'
import type { SupplierValues } from './supplierSchema'

interface SupplierFieldsProps {
  readonly register: UseFormRegister<SupplierValues>
  readonly errors: FieldErrors<SupplierValues>
}

/** Los datos de un proveedor: nombre, contacto, teléfono y una nota. */
export function SupplierFields({ register, errors }: SupplierFieldsProps) {
  return (
    <>
      <TextField id="proveedor-nombre" label="Nombre" field={register('name')} error={errors.name?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="proveedor-contacto" label="Contacto (opcional)" field={register('contact')} error={errors.contact?.message} />
        <TextField id="proveedor-telefono" label="Teléfono (opcional)" type="tel" inputMode="tel" field={register('phone')} error={errors.phone?.message} />
      </div>
      <TextField id="proveedor-nota" label="Nota (opcional)" placeholder="Entrega martes y viernes…" field={register('notes')} error={errors.notes?.message} />
    </>
  )
}
