import { z } from 'zod'

import { MAX_PASSWORD } from '@/services/fieldLimits'

/** La contraseña propia, para confirmar una acción crítica o desbloquear la sesión. */
export const currentPasswordSchema = z.object({
  password: z.string().min(1, 'Escribe tu contraseña').max(MAX_PASSWORD, 'La contraseña es demasiado larga'),
})

export type CurrentPasswordValues = z.infer<typeof currentPasswordSchema>

/** El PIN de desbloqueo: de 4 a 6 dígitos, como lo pide el servidor. */
export const pinRule = z.string().regex(/^\d{4,6}$/, 'El PIN tiene de 4 a 6 dígitos')

export const pinSchema = z.object({ pin: pinRule })

export type PinValues = z.infer<typeof pinSchema>

/** El código de seis dígitos de la aplicación de verificación. */
export const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
})

export type TotpValues = z.infer<typeof totpSchema>

/** Deja solo los dígitos de lo que se escribe en un PIN o un código. */
export function onlyDigits(value: string): string {
  return value.replaceAll(/\D/g, '')
}
