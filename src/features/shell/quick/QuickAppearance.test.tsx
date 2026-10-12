import { afterEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { firstOf, mountRoutes, PERMISSIONS_OWNER, server, signInAs, TEST_SCREENS } from '#jest/harness'
import { useAppearance } from '@/store/appearance'
import { AppShell } from '@/features/shell/AppShell'

const SHEET = { name: 'Apariencia rápida' }

function openShell() {
  server()
  signInAs(PERMISSIONS_OWNER)
  return mountRoutes([{ path: '/', element: <AppShell screens={TEST_SCREENS} />, children: [{ index: true, element: <p>Inicio</p> }] }])
}

afterEach(() => {
  localStorage.clear()
  useAppearance.getState().reset()
})

describe('Apariencia rápida', () => {
  it('cambia el modo, el texto y el alto contraste con el mismo almacén de Apariencia', async () => {
    const { user } = openShell()

    await user.click(firstOf(screen.getAllByRole('button', SHEET)))
    const sheet = await screen.findByRole('dialog', SHEET)
    await user.click(within(sheet).getByRole('radio', { name: 'Oscuro' }))
    await user.click(within(sheet).getByRole('button', { name: 'Texto más grande' }))
    await user.click(within(sheet).getByRole('button', { name: /Alto contraste/u }))

    expect(useAppearance.getState().appearance).toMatchObject({ mode: 'dark', textSize: 'large', contrast: 'high' })
  })

  it('«Texto más pequeño» no baja del tamaño normal', async () => {
    const { user } = openShell()

    await user.click(firstOf(screen.getAllByRole('button', SHEET)))
    const sheet = await screen.findByRole('dialog', SHEET)

    expect(within(sheet).getByRole('button', { name: 'Texto más pequeño' })).toBeDisabled()
  })

  it('lleva a la pantalla completa de Apariencia', async () => {
    const { user, router } = openShell()

    await user.click(firstOf(screen.getAllByRole('button', SHEET)))
    await user.click(within(await screen.findByRole('dialog', SHEET)).getByRole('link', { name: 'Más ajustes de apariencia' }))

    expect(router.state.location.pathname).toBe('/perfil/apariencia')
  })
})
