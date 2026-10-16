import { z } from 'zod'

import { textOptional } from '@/components/formRules'

/** El mismo tope que el servidor. */
export const MAX_REJECTION = 200

/** El motivo del rechazo: obligatorio, para que quien la registró sepa por qué. */
export const rejectWasteSchema = z.object({ reason: textOptional(MAX_REJECTION).min(1, 'Escribe el motivo del rechazo') })
export type RejectWasteValues = z.infer<typeof rejectWasteSchema>
