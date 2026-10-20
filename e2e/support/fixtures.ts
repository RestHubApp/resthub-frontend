// Accesorios comunes de las pruebas: el restaurante propio de cada prueba y
// la forma de abrir la aplicación con una sesión ya iniciada.
import { test as base, expect as expectBase, type Page } from '@playwright/test'

import { randomBytes } from 'node:crypto'

import { API_ORIGIN, createRestaurant, signInPlatformByApi, type Local, type Session, type SessionPlatform } from './api'

const SESSION = 'resthub.session.v3'
// Una dirección que la aplicación no sirve: la prueba la responde con una página vacía.
const BLANK = '/__e2e/sesion'

interface Accessories {
  /** Un restaurante recién dado de alta, solo para esta prueba. */
  local: Local
  /** El mismo, con la caja abierta (S/ 100). */
  restaurantWithCashRegister: Local
  platform: SessionPlatform
}

export const test = base.extend<Accessories>({
  local: async ({}, provide) => {
    const local = await createRestaurant()
    await provide(local)
    await local.http.dispose()
  },
  restaurantWithCashRegister: async ({}, provide) => {
    const local = await createRestaurant({ openCashRegister: true })
    await provide(local)
    await local.http.dispose()
  },
  platform: async ({}, provide) => {
    await provide(await signInPlatformByApi())
  },
})

/** El `expect` de Playwright: las pruebas importan de un solo módulo. */
export const expect = expectBase

/** Cuándo vence el token, en milisegundos, leído de su `exp`. */
function expiryOf(token: string): number {
  const load = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()) as { exp: number }
  return load.exp * 1000
}

/**
 * Abre la aplicación con la sesión de una cuenta ya iniciada, como si hubiera
 * entrado antes en ese navegador. El acceso por el formulario tiene sus
 * propias pruebas; las demás no necesitan repetirlo.
 *
 * Deja lo que dejaría el acceso: la cookie de sesión del API con su valor
 * anti-CSRF y la cuenta guardada sin el token. Al cargar, la aplicación
 * recupera el token de la cookie, como tras recargar.
 */
export async function openAs(page: Page, session: Session | SessionPlatform, destination = '/'): Promise<void> {
  const cookie = session.account.kind === 'platform' ? 'resthub_platform_session' : 'resthub_session'
  await page.context().addCookies([
    { name: cookie, value: session.token, url: API_ORIGIN, httpOnly: true },
    { name: 'resthub_csrf', value: randomBytes(24).toString('base64url'), url: API_ORIGIN, httpOnly: true },
  ])
  const saved = { tag: randomBytes(8).toString('hex'), expiresAt: expiryOf(session.token), account: session.account }
  // La sesión se escribe desde una página vacía del mismo origen, sin la
  // aplicación: abierta en `/acceso`, la aplicación arrancaba con la cuenta
  // anterior y podía volver a guardarla después de escribir la nueva.
  await page.route(BLANK, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>e2e</title>' }))
  try {
    await page.goto(BLANK)
    await page.evaluate(
      ([key, value]) => {
        localStorage.setItem(key, value)
      },
      [SESSION, JSON.stringify(saved)] as const,
    )
  } finally {
    await page.unroute(BLANK)
  }
  await page.goto(destination)
}

/** Lo mismo con la cuenta de la administración del sistema: es la misma sesión del navegador, con otra cuenta. */
export async function openAsPlatform(page: Page, session: SessionPlatform, destination = '/plataforma'): Promise<void> {
  await openAs(page, session, destination)
}

/** El aviso emergente (toast) con ese texto. */
export function notice(page: Page, text: string | RegExp) {
  return page.getByRole('status').filter({ hasText: text }).or(page.getByRole('alert').filter({ hasText: text }))
}

const EVIDENCES = process.env['E2E_EVIDENCE']

/**
 * Guarda una captura de un paso para la documentación, solo si se pidió con
 * `E2E_EVIDENCE=<carpeta>` y en la primera repetición del proyecto de escritorio
 * (o del móvil, si la prueba es solo del celular).
 */
export async function evidence(page: Page, name: string): Promise<void> {
  const info = base.info()
  if (EVIDENCES === undefined || info.repeatEachIndex > 0) {
    return
  }
  await page.screenshot({ path: `${EVIDENCES}/${info.project.name}-${name}.png`, fullPage: false })
}
