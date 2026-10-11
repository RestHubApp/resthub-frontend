import { z } from 'zod'

import { textOptional } from '@/components/formRules'
import type { Supplier } from '@/api/types'

// Los topes del servidor.
export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del proveedor').max(80, 'Usa como máximo 80 caracteres'),
  contact: textOptional(80),
  phone: textOptional(20),
  notes: textOptional(300),
})

export type SupplierValues = z.infer<typeof supplierSchema>

const EMPTY_SUPPLIER: SupplierValues = { name: '', contact: '', phone: '', notes: '' }

/** Los valores iniciales del formulario: los del proveedor que se edita o un formulario vacío. */
export function supplierValuesOf(supplier: Supplier | null): SupplierValues {
  if (supplier === null) {
    return EMPTY_SUPPLIER
  }
  return {
    name: supplier.name,
    contact: supplier.contact,
    phone: supplier.phone,
    notes: supplier.notes,
  }
}
