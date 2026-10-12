import { afterEach, describe, expect, it } from '@jest/globals'
import { act, screen, waitFor, within } from '@testing-library/react'

import { firstOf, mountRoutes, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs, TEST_SCREENS } from '#jest/harness'
import { useAppearance } from '@/store/appearance'
import { AppShell } from '@/features/shell/AppShell'
import { useQuickPalette } from './quickState'

const PALETTE = { name: 'Buscar o ir a…' }
const CTRL_K = '{Control>}k{/Control}'

function openShell() {
  return mountRoutes([
    { path: '/', element: <AppShell screens={TEST_SCREENS} />, children: [{ index: true, element: <input aria-label="Nota" /> }] },
  ])
}

function openAs(permissions: Parameters<typeof signInAs>[0], changes: Parameters<typeof signInAs>[1] = {}) {
  server()
  signInAs(permissions, changes)
  return openShell()
}

afterEach(() => {
  localStorage.clear()
  useAppearance.getState().reset()
  act(() => {
    useQuickPalette.setState({ isOpen: false, hasOpened: false, isSignOutAsked: false })
  })
})

describe('la paleta «Buscar o ir a…»', () => {
  it('se abre con Ctrl+K, deja el foco en el cuadro de búsqueda y Escape la cierra devolviendo el foco', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)
    const note = screen.getByRole('textbox', { name: 'Nota' })
    await user.click(note)

    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)
    expect(within(dialog).getByRole('combobox')).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', PALETTE)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(note).toHaveFocus()
    })
  })

  it('Ctrl+K la alterna y Ctrl+Alt+K no hace nada', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)

    await user.keyboard('{Control>}{Alt>}k{/Alt}{/Control}')
    expect(screen.queryByRole('dialog', PALETTE)).not.toBeInTheDocument()

    await user.keyboard(CTRL_K)
    expect(await screen.findByRole('dialog', PALETTE)).toBeInTheDocument()
    await user.keyboard(CTRL_K)
    expect(screen.queryByRole('dialog', PALETTE)).not.toBeInTheDocument()
  })

  it('se abre también con el botón de la barra lateral', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)

    await user.click(firstOf(screen.getAllByRole('button', PALETTE)))

    expect(await screen.findByRole('dialog', PALETTE)).toBeInTheDocument()
  })

})

describe('la búsqueda y las opciones de la paleta', () => {
  it('busca sin importar tildes ni mayúsculas: «menu» encuentra «Menú»', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.type(within(dialog).getByRole('combobox'), 'MENU')

    expect(within(dialog).getByRole('option', { name: /^Menú/u })).toBeInTheDocument()
    expect(within(dialog).queryByRole('option', { name: /^Caja/u })).not.toBeInTheDocument()
  })

  it('anuncia cuando nada coincide', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.type(within(dialog).getByRole('combobox'), 'zzzz')

    expect(await within(dialog).findByText('Nada coincide con «zzzz»')).toBeInTheDocument()
  })

  it('un mesero no ve Caja ni Personal ni acciones', async () => {
    const { user } = openAs(PERMISSIONS_WAITER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    expect(within(dialog).getByRole('option', { name: /^Pedidos/u })).toBeInTheDocument()
    expect(within(dialog).queryByRole('option', { name: /^Caja/u })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('option', { name: /^Personal/u })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('group', { name: 'Acciones' })).not.toBeInTheDocument()
  })

  it('«Ir a» sigue el orden elegido en Apariencia', async () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    useAppearance.getState().change({ menu: { order: ['/clientes', '/pedidos'], bottom: null } })
    const { user } = openShell()
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    const group = within(dialog).getByRole('group', { name: 'Ir a' })

    expect(within(group).getAllByRole('option')[0]).toHaveTextContent(/^Clientes/u)
    expect(within(group).getAllByRole('option')[1]).toHaveTextContent(/^Pedidos/u)
  })

})

describe('elegir una opción de la paleta', () => {
  it('elegir una pantalla navega a ella y cierra la paleta', async () => {
    const { user, router } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.type(within(dialog).getByRole('combobox'), 'tablero')
    await user.keyboard('{Enter}')

    expect(router.state.location.pathname).toBe('/tablero')
    expect(screen.queryByRole('dialog', PALETTE)).not.toBeInTheDocument()
  })

  it('elegir una acción solo navega a la pantalla con ?accion=', async () => {
    const { user, router } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.click(within(dialog).getByRole('option', { name: /^Abrir caja/u }))

    expect(router.state.location.pathname).toBe('/caja')
    expect(router.state.location.search).toBe('?accion=abrir-caja')
  })

  it('cambiar el modo desde la paleta lo guarda y avisa', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.click(within(dialog).getByRole('option', { name: /^Modo oscuro/u }))

    expect(useAppearance.getState().appearance.mode).toBe('dark')
    expect(screen.queryByRole('dialog', PALETTE)).not.toBeInTheDocument()
    expect(await screen.findAllByText('Modo oscuro')).not.toHaveLength(0)
  })

  it('el texto más grande sube un paso', async () => {
    const { user } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.click(within(dialog).getByRole('option', { name: /^Texto más grande/u }))

    expect(useAppearance.getState().appearance.textSize).toBe('large')
  })

  it('en la vista previa no ofrece cerrar sesión ni la contraseña', async () => {
    const { user } = openAs(PERMISSIONS_OWNER, { preview: true })
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    expect(within(dialog).getByRole('option', { name: /^Mi perfil/u })).toBeInTheDocument()
    expect(within(dialog).queryByRole('option', { name: /^Cerrar sesión/u })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('option', { name: /^Cambiar contraseña/u })).not.toBeInTheDocument()
  })

  it('«Cerrar sesión» cierra la sesión y lleva al acceso', async () => {
    const { user, router } = openAs(PERMISSIONS_OWNER)
    await user.keyboard(CTRL_K)
    const dialog = await screen.findByRole('dialog', PALETTE)

    await user.click(within(dialog).getByRole('option', { name: /^Cerrar sesión/u }))

    expect(router.state.location.pathname).toBe('/acceso')
  })
})
