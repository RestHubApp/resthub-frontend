import { z } from 'zod'

import { decimalRule, textoObligatorio, textoOpcional } from '../../components/formRules'
import { parseDecimal } from './units'

// Los limites repiten los del backend: avisan mientras se escribe.
const MAX_NOMBRE = 80
const MAX_MOTIVO = 200
// Topes contra errores de tipeo, en la unidad que se escribe (kg, L o unid.).
const MAX_CANTIDAD = 100_000
const MAX_COSTO = 100_000

const CANTIDAD = /^\d+(?:[.,]\d{1,3})?$/u

/** Una cantidad escrita en la unidad elegida, con hasta tres decimales. */
function cantidadRule({ permiteCero }: { readonly permiteCero: boolean }) {
  return z
    .string()
    .trim()
    .min(1, 'Escribe la cantidad')
    .regex(CANTIDAD, 'Escribe un número con hasta 3 decimales')
    .refine((valor) => permiteCero || parseDecimal(valor) > 0, 'Tiene que ser mayor que cero')
    .refine((valor) => parseDecimal(valor) <= MAX_CANTIDAD, 'Es demasiado. Revisa el dato')
}

const costoRule = decimalRule({ max: MAX_COSTO, decimales: 3, unidad: 'soles', obligatorio: true })

export const ingredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre del insumo')
    .max(MAX_NOMBRE, `Usa como máximo ${String(MAX_NOMBRE)} caracteres`),
  unit: z.enum(['g', 'ml', 'unit'], 'Elige cómo se mide'),
  min_stock: z.string().trim().regex(/^(?:\d+(?:[.,]\d{1,3})?)?$/u, 'Escribe un número con hasta 3 decimales'),
  min_stock_unit: z.string(),
  unit_cost: decimalRule({ max: MAX_COSTO, decimales: 3, unidad: 'soles' }),
})

export type IngredientValues = z.infer<typeof ingredientSchema>

export const purchaseSchema = z.object({
  quantity: cantidadRule({ permiteCero: false }),
  quantity_unit: z.string(),
  cost_mode: z.enum(['unit', 'total']),
  cost: costoRule,
  reason: textoOpcional(MAX_MOTIVO),
})

export type PurchaseValues = z.infer<typeof purchaseSchema>

export const wasteSchema = z.object({
  quantity: cantidadRule({ permiteCero: false }),
  quantity_unit: z.string(),
  reason: textoObligatorio(MAX_MOTIVO, 'Escribe el motivo de la merma'),
})

export type WasteValues = z.infer<typeof wasteSchema>

export const adjustmentSchema = z
  .object({
    mode: z.enum(['count', 'difference']),
    quantity: cantidadRule({ permiteCero: true }),
    quantity_unit: z.string(),
    sign: z.enum(['add', 'subtract']),
    reason: textoObligatorio(MAX_MOTIVO, 'Escribe el motivo del ajuste'),
  })
  .refine((valores) => valores.mode === 'count' || parseDecimal(valores.quantity) > 0, {
    path: ['quantity'],
    message: 'Una diferencia tiene que ser mayor que cero',
  })

export type AdjustmentValues = z.infer<typeof adjustmentSchema>

export const recipeSchema = z.object({
  lines: z.array(
    z.object({
      ingredient_id: z.number(),
      quantity: cantidadRule({ permiteCero: false }),
    }),
  ),
})

export type RecipeValues = z.infer<typeof recipeSchema>
