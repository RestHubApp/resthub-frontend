import { z } from 'zod'

import type {
  CreatePlatformRestaurantRequest,
  PlatformRestaurantDetail,
  UpdatePlatformRestaurantRequest,
} from '../../api/types'
import { DEFAULT_TIME_ZONE } from '../../services/format'
import {
  correoRule,
  MAX_NOMBRE_COMPLETO,
  nombreRule,
  passwordRule,
} from '../../services/fieldRules'
import { MAX_SLUG, SLUG_PATTERN } from './slug'
import { isValidTimeZone } from './timeZones'

// Los límites repiten los del backend: avisan mientras se escribe, y el
// servidor vuelve a comprobarlos.
export const MAX_RESTAURANT_NAME = 120

export const platformLoginSchema = z.object({
  email: correoRule,
  // Al entrar no se exige la longitud: el servidor ya dice si no coincide.
  password: z.string().min(1, 'Escribe tu contraseña'),
})

export type PlatformLoginValues = z.infer<typeof platformLoginSchema>

const restaurantNameRule = z
  .string()
  .trim()
  .min(1, 'Escribe el nombre del restaurante')
  .max(MAX_RESTAURANT_NAME, `Usa como máximo ${String(MAX_RESTAURANT_NAME)} caracteres`)

export const slugRule = z
  .string()
  .trim()
  .min(1, 'Escribe el identificador')
  .max(MAX_SLUG, `Usa como máximo ${String(MAX_SLUG)} caracteres`)
  .regex(SLUG_PATTERN, 'Usa solo minúsculas, números y guiones, sin guion al inicio ni al final')

/**
 * La zona horaria elegida. `sinCambio` es la que ya tiene el restaurante: esa
 * no se vuelve a validar, así una zona guardada que este navegador no conoce
 * no impide cambiarle el nombre.
 */
export function timeZoneRule(sinCambio?: string) {
  return z
    .string()
    .min(1, 'Elige la zona horaria')
    .refine((zona) => zona === sinCambio || isValidTimeZone(zona), 'Elige una zona horaria de la lista')
}

/** Un encargado: la primera cuenta del restaurante o una más. */
export const ownerSchema = z.object({
  full_name: nombreRule('nombre completo', MAX_NOMBRE_COMPLETO, 'el'),
  email: correoRule,
  password: passwordRule,
})

export type OwnerValues = z.infer<typeof ownerSchema>

export const EMPTY_OWNER: OwnerValues = { full_name: '', email: '', password: '' }

export const createRestaurantSchema = z.object({
  name: restaurantNameRule,
  slug: slugRule,
  timezone: timeZoneRule(),
  owner: ownerSchema,
})

export type CreateRestaurantValues = z.infer<typeof createRestaurantSchema>

export const EMPTY_RESTAURANT: CreateRestaurantValues = {
  name: '',
  slug: '',
  timezone: DEFAULT_TIME_ZONE,
  owner: EMPTY_OWNER,
}

/** Lo validado ya tiene la forma del contrato: el esquema recortó y pasó el correo a minúsculas. */
export function createRestaurantPayload(values: CreateRestaurantValues): CreatePlatformRestaurantRequest {
  return { name: values.name, slug: values.slug, timezone: values.timezone, owner: { ...values.owner } }
}

/** El nombre y la zona de un restaurante que ya existe, con la zona que tiene guardada. */
export function restaurantSettingsSchema(currentTimeZone: string) {
  return z.object({
    name: restaurantNameRule,
    timezone: timeZoneRule(currentTimeZone),
  })
}

export type RestaurantSettingsValues = z.infer<ReturnType<typeof restaurantSettingsSchema>>

export function settingsOf(restaurant: PlatformRestaurantDetail): RestaurantSettingsValues {
  return { name: restaurant.name, timezone: restaurant.timezone }
}

/**
 * Solo lo que cambió: la bitácora registra cada edición, y reenviar un nombre
 * igual no es un cambio.
 */
export function settingsPayload(
  values: RestaurantSettingsValues,
  current: PlatformRestaurantDetail,
): UpdatePlatformRestaurantRequest {
  const cambios: UpdatePlatformRestaurantRequest = {}
  if (values.name !== current.name) {
    cambios.name = values.name
  }
  if (values.timezone !== current.timezone) {
    cambios.timezone = values.timezone
  }
  return cambios
}
