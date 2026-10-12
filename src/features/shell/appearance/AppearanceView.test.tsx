import { afterEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, signInAs, TEST_SCREENS } from '#jest/harness'
import type { PermissionCode } from '@/api/types'
import { DEFAULT_APPEARANCE } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { ShellScreensContext } from '@/features/shell/shellScreens'
import { AppearanceView } from './AppearanceView'

const KEY = 'resthub.appearance.v1.staff.7'

function openAppearance(permissions: readonly PermissionCode[] = PERMISSIONS_WAITER) {
  signInAs(permissions)
  return mountScreen(
    <ShellScreensContext value={TEST_SCREENS}>
      <AppearanceView />
    </ShellScreensContext>,
    { path: '/perfil/apariencia' },
  )
}

/** Las pantallas del menú en el orden en que la lista las muestra. */
function menuOrder(): string[] {
  const list = screen.getByRole('list', { name: '' })
  return within(list)
    .getAllByRole('listitem')
    .map((item) => within(item).getByRole('button', { name: /^Subir / }).getAttribute('aria-label')?.replace('Subir ', '') ?? '')
}

function pathOf(label: string): string | undefined {
  return TEST_SCREENS.find((entry) => entry.nav?.label === label)?.path
}

afterEach(() => {
  localStorage.clear()
  useAppearance.getState().reset()
})

describe('AppearanceView', () => {
  it('ofrece los seis temas y «Según el sistema», con Terracota elegido', () => {
    openAppearance()

    const themes = screen.getAllByRole('radio', { name: /Terracota|Noche|Alto contraste|Oliva|Pizarra|Vino|Según el sistema/u })
    expect(themes).toHaveLength(7)
    expect(screen.getByRole('radio', { name: /Terracota/u })).toBeChecked()
  })

  it('elegir un tema lo aplica al instante y lo guarda para la cuenta', async () => {
    const { user } = openAppearance()

    await user.click(screen.getByRole('radio', { name: /Noche/u }))

    expect(screen.getByRole('radio', { name: /Noche/u })).toBeChecked()
    expect(document.documentElement).toHaveAttribute('data-theme', 'night')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ theme: 'night' })
  })

  it('elegir la letra y el tamaño del texto los aplica a la página', async () => {
    const { user } = openAppearance()

    await user.click(screen.getByRole('radio', { name: /Atkinson/u }))
    await user.click(screen.getByRole('radio', { name: /Muy grande/u }))

    expect(document.documentElement).toHaveAttribute('data-font', 'atkinson')
    expect(document.documentElement).toHaveAttribute('data-text-size', 'larger')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ font: 'atkinson', textSize: 'larger' })
  })

})

describe('el menú de AppearanceView', () => {
  it('el menú lista solo lo que el mesero puede abrir', () => {
    openAppearance()

    const order = menuOrder()
    expect(order).toEqual(expect.arrayContaining(['Pedidos', 'Cocina', 'Reservas', 'Clientes']))
    expect(order).not.toContain('Caja')
    expect(order).not.toContain('Personal')
  })

  it('«Bajar» y «Subir» reordenan, se anuncia el nuevo lugar y el orden se guarda', async () => {
    const { user } = openAppearance()
    const [first = '', second = ''] = menuOrder()

    await user.click(screen.getByRole('button', { name: `Bajar ${first}` }))

    expect(menuOrder().slice(0, 2)).toEqual([second, first])
    expect(screen.getByRole('status')).toHaveTextContent(`${first}: lugar 2 de ${String(menuOrder().length)}.`)
    const paths = [second, first].map((label) => pathOf(label))
    expect(useAppearance.getState().appearance.menu.order.slice(0, 2)).toEqual(paths)

    await user.click(screen.getByRole('button', { name: `Subir ${first}` }))
    expect(menuOrder().slice(0, 2)).toEqual([first, second])
  })

  it('subir la primera o bajar la última no hace nada', async () => {
    const { user } = openAppearance()
    const before = menuOrder()
    const last = before.at(-1) ?? ''

    const up = screen.getByRole('button', { name: `Subir ${before[0] ?? ''}` })
    expect(up).toHaveAttribute('aria-disabled', 'true')
    await user.click(up)
    await user.click(screen.getByRole('button', { name: `Bajar ${last}` }))

    expect(menuOrder()).toEqual(before)
  })

  it('la barra de abajo admite cuatro: con la barra llena las demás no se pueden marcar', async () => {
    const { user } = openAppearance(PERMISSIONS_OWNER)

    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(4)
    for (const box of screen.getAllByRole('checkbox', { checked: false })) {
      expect(box).toBeDisabled()
    }
    expect(screen.getByText(/4 de 4/u)).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /^Pedidos/u }))

    expect(screen.getByText(/3 de 4/u)).toBeInTheDocument()
    expect(useAppearance.getState().appearance.menu.bottom).toHaveLength(3)
    for (const box of screen.getAllByRole('checkbox', { checked: false })) {
      expect(box).toBeEnabled()
    }
  })

  it('«Restablecer el menú» devuelve el orden de fábrica y la barra por omisión', async () => {
    const { user } = openAppearance()
    const before = menuOrder()
    await user.click(screen.getByRole('button', { name: `Bajar ${before[0] ?? ''}` }))
    await user.click(screen.getByRole('checkbox', { name: /^Cocina/u }))

    await user.click(screen.getByRole('button', { name: 'Restablecer el menú' }))

    expect(menuOrder()).toEqual(before)
    expect(useAppearance.getState().appearance.menu).toEqual(DEFAULT_APPEARANCE.menu)
  })

  it('«Volver a todo lo de siempre» restablece también el tema, la letra y el tamaño', async () => {
    const { user } = openAppearance()
    await user.click(screen.getByRole('radio', { name: /Vino/u }))

    await user.click(screen.getByRole('button', { name: 'Volver a todo lo de siempre' }))

    expect(screen.getByRole('radio', { name: /Terracota/u })).toBeChecked()
    expect(document.documentElement).toHaveAttribute('data-theme', 'terracotta')
  })
})
