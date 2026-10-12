// Accesorios comunes de las pruebas: el restaurante propio de cada prueba y
// la forma de abrir la aplicación con una sesión ya iniciada.
import { test as base, expect as expectBase, type Page } from '@playwright/test'

import { createRestaurant, signInPlatformByApi, newHttp, type Local, type Session, type SessionPlatform } from './api'

const SESSION = 'resthub.session.v2'

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
    const http = await newHttp()
    await provide(await signInPlatformByApi(http))
    await http.dispose()
  },
})

/** El `expect` de Playwright: las pruebas importan de un solo módulo. */
export const expect = expectBase

/**
 * Abre la aplicación con la sesión de una cuenta ya iniciada, como si hubiera
 * entrado antes en ese navegador. El acceso por el formulario tiene sus
 * propias pruebas; las demás no necesitan repetirlo.
 */
export async function openAs(page: Page, session: Session | SessionPlatform, destination = '/'): Promise<void> {
  await page.goto('/acceso')
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [SESSION, JSON.stringify({ token: session.token, account: session.account })] as const,
  )
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
