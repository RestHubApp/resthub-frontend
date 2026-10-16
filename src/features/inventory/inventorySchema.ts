import { z } from 'zod'

import { decimalRule, textRequired, textOptional } from '@/components/formRules'
import { packagingFields, packagingIssues } from './packagingSchema'
import { parseDecimal } from './units'

// Los limites repiten los del backend: avisan mientras se escribe.
const MAX_NAME = 80
const MAX_REASON = 200
// Topes contra errores de tipeo, en la unidad que se escribe (kg, L o unid.).
const MAX_QUANTITY = 100_000
const MAX_COST = 100_000

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const QUANTITY = /^\d+(?:[.,]\d{1,3})?$/u

/** Una cantidad escrita en la unidad elegida, con hasta tres decimales. */
function quantityRule({ allowsZero }: { readonly allowsZero: boolean }) {
  return z
    .string()
    .trim()
    .min(1, 'Escribe la cantidad')
    .regex(QUANTITY, 'Escribe un número con hasta 3 decimales')
    .refine((value) => allowsZero || parseDecimal(value) > 0, 'Tiene que ser mayor que cero')
    .refine((value) => parseDecimal(value) <= MAX_QUANTITY, 'Es demasiado. Revisa el dato')
}

const costRule = decimalRule({ max: MAX_COST, decimals: 3, unit: 'soles', required: true })

export const ingredientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Escribe el nombre del insumo')
      .max(MAX_NAME, `Usa como máximo ${String(MAX_NAME)} caracteres`),
    unit: z.enum(['g', 'ml', 'unit'], 'Elige cómo se mide'),
    // eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
    min_stock: z.string().trim().regex(/^(?:\d+(?:[.,]\d{1,3})?)?$/u, 'Escribe un número con hasta 3 decimales'),
    min_stock_unit: z.string(),
    unit_cost: decimalRule({ max: MAX_COST, decimals: 3, unit: 'soles' }),
    ...packagingFields,
  })
  .superRefine((values, context) => {
    for (const [field, message] of packagingIssues(values)) {
      context.addIssue({ code: 'custom', path: [field], message })
    }
  })

export type IngredientValues = z.infer<typeof ingredientSchema>

export const purchaseSchema = z.object({
  quantity: quantityRule({ allowsZero: false }),
  quantity_unit: z.string(),
  cost_mode: z.enum(['unit', 'total']),
  cost: costRule,
  reason: textOptional(MAX_REASON),
})

export type PurchaseValues = z.infer<typeof purchaseSchema>

export const wasteSchema = z.object({
  quantity: quantityRule({ allowsZero: false }),
  quantity_unit: z.string(),
  reason: textRequired(MAX_REASON, 'Escribe el motivo de la merma'),
})

export type WasteValues = z.infer<typeof wasteSchema>

export const adjustmentSchema = z
  .object({
    mode: z.enum(['count', 'difference']),
    quantity: quantityRule({ allowsZero: true }),
    quantity_unit: z.string(),
    sign: z.enum(['add', 'subtract']),
    reason: textRequired(MAX_REASON, 'Escribe el motivo del ajuste'),
  })
  .refine((values) => values.mode === 'count' || parseDecimal(values.quantity) > 0, {
    path: ['quantity'],
    message: 'Una diferencia tiene que ser mayor que cero',
  })

export type AdjustmentValues = z.infer<typeof adjustmentSchema>

export const recipeSchema = z.object({
  lines: z.array(
    z.object({
      ingredient_id: z.number(),
      quantity: quantityRule({ allowsZero: false }),
    }),
  ),
})

export type RecipeValues = z.infer<typeof recipeSchema>
