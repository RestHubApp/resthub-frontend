import { z } from 'zod'

// El mismo tope que el servidor. Es texto y no numero: en un local chico
// conviven "5", "Terraza 2" y "Barra".
export const MAX_LABEL = 30

export const tableSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la mesa')
    .max(MAX_LABEL, `Usa como máximo ${String(MAX_LABEL)} caracteres`),
})

export type TableValues = z.infer<typeof tableSchema>
