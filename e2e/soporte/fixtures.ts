// Accesorios comunes de las pruebas: el restaurante propio de cada prueba y
// la forma de abrir la aplicación con una sesión ya iniciada.
import { test as base, expect as expectBase, type Page } from '@playwright/test'

import { createRestaurant, signInPlatformByApi, newHttp, type Local, type Session, type SessionPlatform } from './api'

declare global {
  interface Window {
    __RESTHUB_E2E?: boolean
  }
}

const SESSION = 'resthub.session.v2'
const SESSION_PLATFORM = 'resthub.platform-session.v1'

interface Accessories {
  /** Un restaurante recién dado de alta, solo para esta prueba. */
  local: Local
  /** El mismo, con la caja abierta (S/ 100). */
  restaurantWithCashRegister: Local
  platform: SessionPlatform
}

export const test = base.extend<Accessories>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.__RESTHUB_E2E = true
    })
    await use(page)
  },
  local: async ({}, use) => {
    const local = await createRestaurant()
    await use(local)
    await local.http.dispose()
  },
  restaurantWithCashRegister: async ({}, use) => {
    const local = await createRestaurant({ openCashRegister: true })
    await use(local)
    await local.http.dispose()
  },
  platform: async ({}, use) => {
    const http = await newHttp()
    await use(await signInPlatformByApi(http))
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
export async function openAs(page: Page, session: Session, destination = '/'): Promise<void> {
  await page.goto('/acceso')
  await page.evaluate(
    ([password, value]) => {
      localStorage.setItem(password, value)
    },
    [SESSION, JSON.stringify({ token: session.token, account: session.account })] as const,
  )
  await page.goto(destination)
}

export async function openAsPlatform(page: Page, session: SessionPlatform, destination = '/plataforma'): Promise<void> {
  await page.goto('/plataforma/acceso')
  await page.evaluate(
    ([password, value]) => {
      localStorage.setItem(password, value)
    },
    [SESSION_PLATFORM, JSON.stringify({ token: session.token, admin: session.admin })] as const,
  )
  await page.goto(destination)
}

/** El aviso emergente (toast) con ese texto. */
export function notice(page: Page, text: string | RegExp) {
  return page.getByRole('status').filter({ hasText: text }).or(page.getByRole('alert').filter({ hasText: text }))
}

const EVIDENCES = process.env.E2E_EVIDENCIAS

/**
 * Guarda una captura de un paso para la documentación, solo si se pidió con
 * `E2E_EVIDENCIAS=<carpeta>` y en la primera repetición del proyecto de escritorio
 * (o del móvil, si la prueba es solo del celular).
 */
export async function evidence(page: Page, name: string): Promise<void> {
  const info = base.info()
  if (EVIDENCES === undefined || info.repeatEachIndex > 0) {
    return
  }
  await page.screenshot({ path: `${EVIDENCES}/${info.project.name}-${name}.png`, fullPage: false })
}
