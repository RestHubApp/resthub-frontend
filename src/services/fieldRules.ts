import { z } from 'zod'

// Reglas de los datos de una persona, compartidas por el acceso, el perfil y
// el alta de personal.
//
// Los limites repiten los del backend. Repetirlos no duplica la regla, que
// sigue viviendo en el servidor: avisa mientras la persona escribe y no
// despues de un viaje.

export const MIN_PASSWORD = 10
export const MAX_PASSWORD = 128
export const MAX_COMPLETE_NAME = 120

// Letras de cualquier idioma, con tildes y enie, separadas por un espacio, un
// guion o un apostrofo: "María José", "Pérez-Luna", "O'Brien".
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const WORDS = /^\p{L}+(?:[ '-]\p{L}+)*$/u
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const PHONE = /^\+?\d+(?: \d+)*$/u
const MIN_DIGITS_PHONE = 7
const MAX_DIGITS_PHONE = 15

/** Quita lo que no puede ir en un nombre mientras la persona escribe. */
export function onlyLetters(value: string): string {
  return value.replace(/[^\p{L} '-]/gu, '')
}

/** Deja solo los digitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/gu, '')
}

/** Deja digitos, espacios y el `+` del codigo de pais. */
export function onlyPhone(value: string): string {
  return value.replace(/[^\d +]/gu, '')
}

function countDigits(value: string): number {
  return onlyDigits(value).length
}

function phoneValid(value: string): boolean {
  if (value === '') {
    return true
  }
  const digits = countDigits(value)
  return (
    PHONE.test(value) && digits >= MIN_DIGITS_PHONE && digits <= MAX_DIGITS_PHONE
  )
}

/** `posesivo` es "tu" cuando la persona escribe lo suyo y "el" cuando carga a otra. */
export function nameRule(data: string, max: number, possessive: 'tu' | 'el' = 'tu'): z.ZodString {
  const subject = `${possessive === 'tu' ? 'Tu' : 'El'} ${data}`
  return z
    .string()
    .trim()
    .min(1, `Escribe ${possessive} ${data}`)
    .max(max, `Usa como máximo ${String(max)} caracteres`)
    .regex(WORDS, `${subject} solo puede llevar letras, espacios, guiones o apóstrofos`)
}

export const emailRule = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Escribe un correo válido, como nombre@correo.com'))

export const phoneRule = z
  .string()
  .trim()
  .refine(phoneValid, 'Escribe un teléfono de 7 a 15 dígitos, como 987 654 321')

export const passwordRule = z
  .string()
  .min(MIN_PASSWORD, `Usa al menos ${String(MIN_PASSWORD)} caracteres`)
  .max(MAX_PASSWORD, `Usa como máximo ${String(MAX_PASSWORD)} caracteres`)
