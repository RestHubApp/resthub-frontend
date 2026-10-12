import { afterEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { firstOf, mountRoutes, PERMISSIONS_WAITER, second, server, signInAs, TEST_SCREENS } from '#jest/harness'
import type { MenuPreference } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { AppShell } from './AppShell'

const MENU = { name: 'Navegación principal' }

function openShell() {
  return mountRoutes([
    { path: '/', element: <AppShell screens={TEST_SCREENS} />, children: [{ index: true, element: <p>Inicio</p> }] },
  ])
}

function labels(zone: HTMLElement): string[] {
  return within(zone).getAllByRole('link').map((link) => link.textContent)
}

function openWith(menu: MenuPreference) {
  server()
  signInAs(PERMISSIONS_WAITER)
  useAppearance.getState().change({ menu })
  return openShell()
}

afterEach(() => {
  localStorage.clear()
  useAppearance.getState().reset()
})

describe('el menú con el orden de la cuenta', () => {
  it('sin nada elegido, la barra de abajo son las primeras cuatro del orden de fábrica', () => {
    openWith({ order: [], bottom: null })

    const sidebar = firstOf(screen.getAllByRole('navigation', MENU))
    const bottom = second(screen.getAllByRole('navigation', MENU))
    expect(labels(bottom)).toEqual(labels(sidebar).slice(0, 4))
  })

  it('el menú lateral sigue el orden elegido y lo que no se nombró va al final', () => {
    openWith({ order: ['/clientes', '/pedidos'], bottom: null })

    const names = labels(firstOf(screen.getAllByRole('navigation', MENU)))
    expect(names.slice(0, 2)).toEqual(['Clientes', 'Pedidos'])
    expect(names).toHaveLength(new Set(names).size)
  })

  it('la barra de abajo muestra las elegidas y «Más» guarda las demás', async () => {
    const { user } = openWith({ order: ['/clientes'], bottom: ['/clientes', '/reservas'] })

    expect(labels(second(screen.getAllByRole('navigation', MENU)))).toEqual(['Clientes', 'Reservas'])

    await user.click(screen.getByRole('button', { name: 'Más' }))
    const sheet = await screen.findByRole('dialog', { name: 'Más' })
    expect(within(sheet).getByRole('link', { name: 'Pedidos' })).toBeInTheDocument()
    expect(within(sheet).queryByRole('link', { name: 'Clientes' })).not.toBeInTheDocument()
  })

  it('un orden guardado con pantallas sin permiso no las muestra', () => {
    openWith({ order: ['/caja', '/personal', '/clientes'], bottom: ['/caja', '/personal', '/clientes'] })

    const sidebar = firstOf(screen.getAllByRole('navigation', MENU))
    const bottom = second(screen.getAllByRole('navigation', MENU))
    expect(within(sidebar).queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
    expect(within(sidebar).queryByRole('link', { name: 'Personal' })).not.toBeInTheDocument()
    expect(labels(bottom)).toEqual(['Clientes'])
  })
})
