import { z } from 'zod'

import { emailRule, MAX_PASSWORD } from '@/services/fieldRules'

export const loginSchema = z.object({
  email: emailRule,
  // Al entrar no se exige el minimo: la respuesta del servidor ya dice si
  // la contrasena no coincide, y repetir aca la regla no agrega nada. El
  // maximo si, porque el servidor rechaza una mas larga antes de mirarla.
  password: z
    .string()
    .min(1, 'Escribe tu contraseña')
    .max(MAX_PASSWORD, `Usa como máximo ${String(MAX_PASSWORD)} caracteres`),
})

export type LoginFormValues = z.infer<typeof loginSchema>
