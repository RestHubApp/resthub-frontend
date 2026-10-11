import { z } from 'zod'

import type { MenuItem } from '@/api/types'
import { decimalParaApi, decimalRule, textoOpcional } from '@/components/formRules'

// Los limites repiten los del backend: avisan mientras se escribe.
const MAX_CATEGORY = 60
const MAX_DISH = 120
const MAX_DESCRIPTION = 300
// Un precio de cinco cifras en un restaurante familiar es un error de tipeo.
const MAX_PRICE = 9999

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la categoría')
    .max(MAX_CATEGORY, `Usa como máximo ${String(MAX_CATEGORY)} caracteres`),
})

export type CategoryValues = z.infer<typeof categorySchema>

export const menuItemSchema = z.object({
  category_id: z.string().min(1, 'Elige la categoría'),
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre del plato')
    .max(MAX_DISH, `Usa como máximo ${String(MAX_DISH)} caracteres`),
  description: textoOpcional(MAX_DESCRIPTION),
  price: decimalRule({ max: MAX_PRICE, decimales: 2, unidad: 'soles', obligatorio: true }),
})

export type MenuItemValues = z.infer<typeof menuItemSchema>

export function emptyMenuItem(categoryId: number | undefined): MenuItemValues {
  return {
    category_id: categoryId === undefined ? '' : String(categoryId),
    name: '',
    description: '',
    price: '',
  }
}

export function menuItemValuesOf(item: MenuItem): MenuItemValues {
  return {
    category_id: String(item.category_id),
    name: item.name,
    description: item.description,
    price: item.price,
  }
}

/** El cuerpo que espera el API: el precio como texto decimal con punto. */
export function menuItemPayload(values: MenuItemValues) {
  return {
    category_id: Number(values.category_id),
    name: values.name,
    description: values.description,
    price: decimalParaApi(values.price) ?? '0',
  }
}
