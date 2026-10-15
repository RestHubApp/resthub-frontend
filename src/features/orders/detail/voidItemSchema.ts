import { z } from 'zod'

import { textOptional } from '@/components/formRules'

/** El mismo tope que el servidor. */
export const MAX_VOID_REASON = 200

/** El motivo de una anulación: obligatorio, pero un motivo rápido corto («Sin insumo») vale. */
export const voidItemSchema = z.object({ reason: textOptional(MAX_VOID_REASON).min(1, 'Escribe el motivo') })
export type VoidItemValues = z.infer<typeof voidItemSchema>
