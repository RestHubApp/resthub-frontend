import { z } from 'zod'

import type { BillingSettings, BillingSettingsRequest, TaxRegime } from '@/api/types'

/** Los regímenes tributarios, con el texto que ve el encargado. El Nuevo RUS solo emite boletas. */
export const TAX_REGIMES = [
  { id: 'general', label: 'Régimen general' },
  { id: 'special', label: 'Régimen especial (RER)' },
  { id: 'mype', label: 'Régimen MYPE tributario (RMT)' },
  { id: 'new_rus', label: 'Nuevo RUS (solo boletas)' },
] as const satisfies readonly { readonly id: TaxRegime; readonly label: string }[]

const SOL_USER = /^[A-Z0-9]{3,20}$/u

const SERIES = { B: /^B[A-Z0-9]{3}$/u, F: /^F[A-Z0-9]{3}$/u } as const

function series(letter: keyof typeof SERIES) {
  return z.string().trim().toUpperCase().regex(SERIES[letter], `Cuatro caracteres, empieza con ${letter}`)
}

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
      tax_regime: z.enum(['general', 'special', 'mype', 'new_rus']),
      boleta_series: series('B'),
      factura_series: series('F'),
      boleta_credit_note_series: series('B'),
      factura_credit_note_series: series('F'),
      sol_user: z
        .string()
        .trim()
        .toUpperCase()
        .refine((user) => user === '' || SOL_USER.test(user), 'De 3 a 20 letras o números, sin el RUC delante'),
      sol_password: z.string().max(100, 'Usa como máximo 100 caracteres'),
    })
    .superRefine((values, context) => {
      for (const issue of [solIssue(saved, values), ...creditNoteSeriesIssues(values)]) {
        if (issue !== null) {
          context.addIssue({ code: 'custom', ...issue })
        }
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

interface SeriesValues {
  readonly boleta_series: string
  readonly factura_series: string
  readonly boleta_credit_note_series: string
  readonly factura_credit_note_series: string
}

const SAME_SERIES = 'Usa una serie distinta a la del comprobante'

/** La nota de crédito numera aparte: no puede compartir la serie de las boletas o las facturas que anula. */
function creditNoteSeriesIssues(values: SeriesValues) {
  return [
    values.boleta_credit_note_series === values.boleta_series ? { path: ['boleta_credit_note_series'], message: SAME_SERIES } : null,
    values.factura_credit_note_series === values.factura_series ? { path: ['factura_credit_note_series'], message: SAME_SERIES } : null,
  ]
}

/** Lo que se muestra al abrir: los datos guardados y las credenciales SOL vacías (nunca se devuelven). */
export function valuesOf(settings: BillingSettings): SettingsValues {
  return {
    ruc: settings.ruc,
    legal_name: settings.legal_name,
    address: settings.address,
    igv_rate: settings.igv_rate,
    tax_regime: settings.tax_regime,
    boleta_series: settings.boleta_series,
    factura_series: settings.factura_series,
    boleta_credit_note_series: settings.boleta_credit_note_series,
    factura_credit_note_series: settings.factura_credit_note_series,
    sol_user: '',
    sol_password: '',
  }
}

/** El cuerpo del PUT: sin credenciales SOL escritas, no se mandan y el servidor conserva las que tenía. */
export function requestOf({ sol_user, sol_password, ...values }: SettingsValues): BillingSettingsRequest {
  const body = { ...values, igv_rate: values.igv_rate.replace(',', '.') }
  return sol_user === '' ? body : { ...body, sol_user, sol_password }
}
