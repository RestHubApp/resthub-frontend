import { z } from 'zod'

import { decimalRule, textoObligatorio } from '../../../components/formRules'

// Los topes del servidor: 100 % y un motivo de hasta 200 caracteres.
const MAX_PORCENTAJE = 100
export const MAX_ADJUSTMENT_REASON = 200

export const discountSchema = z.object({
  percent: decimalRule({ max: MAX_PORCENTAJE, decimales: 2, unidad: '%', obligatorio: true }),
  reason: textoObligatorio(MAX_ADJUSTMENT_REASON, 'Escribe el motivo'),
})

export type DiscountValues = z.infer<typeof discountSchema>
