import { z } from 'zod'

import type { BillingSettings, BillingSettingsRequest } from '@/api/types'

const SOL_USER = /^[A-Z0-9]{3,20}$/u

/**
 * Las reglas de los datos fiscales, con los guardados a la vista: el usuario y
 * la clave SOL van juntos, y con otro RUC las credenciales cargadas ya no
 * sirven, así que hay que volver a escribirlas.
 */
export function settingsSchema(saved: BillingSettings) {
  return z
    .object({
      // eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
      ruc: z.string().trim().regex(/^(?:(?:10|15|17|20)\d{9})?$/u, 'El RUC tiene 11 dígitos y empieza en 10 o 20'),
      legal_name: z.string().trim().max(100, 'Usa como máximo 100 caracteres'),
      address: z.string().trim().max(200, 'Usa como máximo 200 caracteres'),
      // eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
      igv_rate: z.string().trim().regex(/^\d{1,2}(?:[.,]\d{1,2})?$/u, 'Escribe un porcentaje como 18 o 10.5'),
      boleta_series: z.string().trim().toUpperCase().regex(/^B[A-Z0-9]{3}$/u, 'Cuatro caracteres, empieza con B'),
      factura_series: z.string().trim().toUpperCase().regex(/^F[A-Z0-9]{3}$/u, 'Cuatro caracteres, empieza con F'),
      sol_user: z
        .string()
        .trim()
        .toUpperCase()
        .refine((user) => user === '' || SOL_USER.test(user), 'De 3 a 20 letras o números, sin el RUC delante'),
      sol_password: z.string().max(100, 'Usa como máximo 100 caracteres'),
    })
    .superRefine((values, context) => {
      const issue = solIssue(saved, values)
      if (issue !== null) {
        context.addIssue({ code: 'custom', ...issue })
      }
    })
}

export type SettingsValues = z.infer<ReturnType<typeof settingsSchema>>

interface SolValues {
  readonly ruc: string
  readonly sol_user: string
  readonly sol_password: string
}

function solIssue(saved: BillingSettings, { ruc, sol_user, sol_password }: SolValues) {
  if (sol_user !== '' && sol_password === '') {
    return { path: ['sol_password'], message: 'Escribe también la clave SOL' }
  }
  if (sol_user === '' && sol_password !== '') {
    return { path: ['sol_user'], message: 'Escribe también el usuario SOL' }
  }
  if (sol_user === '' && saved.has_sol_credentials && ruc !== saved.ruc) {
    return { path: ['sol_user'], message: 'Con otro RUC, vuelve a escribir el usuario y la clave SOL' }
  }
  return null
}

/** Lo que se muestra al abrir: los datos guardados y las credenciales SOL vacías (nunca se devuelven). */
export function valuesOf(settings: BillingSettings): SettingsValues {
  return {
    ruc: settings.ruc,
    legal_name: settings.legal_name,
    address: settings.address,
    igv_rate: settings.igv_rate,
    boleta_series: settings.boleta_series,
    factura_series: settings.factura_series,
    sol_user: '',
    sol_password: '',
  }
}

/** El cuerpo del PUT: sin credenciales SOL escritas, no se mandan y el servidor conserva las que tenía. */
export function requestOf({ sol_user, sol_password, ...values }: SettingsValues): BillingSettingsRequest {
  const body = { ...values, igv_rate: values.igv_rate.replace(',', '.') }
  return sol_user === '' ? body : { ...body, sol_user, sol_password }
}
