// Accesorios comunes de las pruebas: el restaurante propio de cada prueba y
// la forma de abrir la aplicación con una sesión ya iniciada.
import { test as base, expect as expectBase, type Page } from '@playwright/test'

import { crearLocal, entrarPlataformaPorApi, nuevoHttp, type Local, type Sesion, type SesionPlataforma } from './api'

const SESION = 'resthub.session.v2'
const SESION_PLATAFORMA = 'resthub.platform-session.v1'

interface Accesorios {
  /** Un restaurante recién dado de alta, solo para esta prueba. */
  local: Local
  /** El mismo, con la caja abierta (S/ 100). */
  localConCaja: Local
  plataforma: SesionPlataforma
}

export const test = base.extend<Accesorios>({
  local: async ({}, usar) => {
    const local = await crearLocal()
    await usar(local)
    await local.http.dispose()
  },
  localConCaja: async ({}, usar) => {
    const local = await crearLocal({ cajaAbierta: true })
    await usar(local)
    await local.http.dispose()
  },
  plataforma: async ({}, usar) => {
    const http = await nuevoHttp()
    await usar(await entrarPlataformaPorApi(http))
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
export async function abrirComo(page: Page, sesion: Sesion, destino = '/'): Promise<void> {
  await page.goto('/acceso')
  await page.evaluate(
    ([clave, valor]) => {
      localStorage.setItem(clave, valor)
    },
    [SESION, JSON.stringify({ token: sesion.token, account: sesion.cuenta })] as const,
  )
  await page.goto(destino)
}

export async function abrirComoPlataforma(page: Page, sesion: SesionPlataforma, destino = '/plataforma'): Promise<void> {
  await page.goto('/plataforma/acceso')
  await page.evaluate(
    ([clave, valor]) => {
      localStorage.setItem(clave, valor)
    },
    [SESION_PLATAFORMA, JSON.stringify({ token: sesion.token, admin: sesion.admin })] as const,
  )
  await page.goto(destino)
}

/** El aviso emergente (toast) con ese texto. */
export function aviso(page: Page, texto: string | RegExp) {
  return page.getByRole('status').filter({ hasText: texto }).or(page.getByRole('alert').filter({ hasText: texto }))
}

const EVIDENCIAS = process.env.E2E_EVIDENCIAS

/**
 * Guarda una captura de un paso para la documentación, solo si se pidió con
 * `E2E_EVIDENCIAS=<carpeta>` y en la primera repetición del proyecto de escritorio
 * (o del móvil, si la prueba es solo del celular).
 */
export async function evidencia(page: Page, nombre: string): Promise<void> {
  const info = base.info()
  if (EVIDENCIAS === undefined || info.repeatEachIndex > 0) {
    return
  }
  await page.screenshot({ path: `${EVIDENCIAS}/${info.project.name}-${nombre}.png`, fullPage: false })
}
