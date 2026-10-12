import { describe, expect, it } from '@jest/globals'

import { buildAccount, PERMISSIONS_OWNER, PERMISSIONS_WAITER, TEST_SCREENS } from '#jest/harness'
import type { Session } from '@/api/types'
import { SCREEN_ACTIONS } from '@/hooks/screenActions'
import { entriesFor } from '@/features/shell/navigation'
import { buildQuickCommands, type QuickCommand } from './quickCommands'

function commandsFor(account: Session, changes: { readonly isPreview?: boolean } = {}): readonly QuickCommand[] {
  return buildQuickCommands({
    entries: entriesFor(TEST_SCREENS, account.permissions),
    account,
    isPreview: changes.isPreview ?? false,
    mode: 'system',
    isHighContrast: false,
    canSmaller: true,
    canLarger: true,
  })
}

function labels(commands: readonly QuickCommand[], group: QuickCommand['group']): string[] {
  return commands.filter((command) => command.group === group).map((command) => command.label)
}

describe('las opciones de la paleta', () => {
  it('«Ir a» son las pantallas del menú de la cuenta y en su mismo orden', () => {
    const account = buildAccount(PERMISSIONS_OWNER)
    const entries = entriesFor(TEST_SCREENS, account.permissions)

    expect(labels(commandsFor(account), 'go')).toEqual(entries.map((entry) => entry.label))
  })

  it('un mesero no ve Caja ni Personal ni las acciones del encargado', () => {
    const commands = commandsFor(buildAccount(PERMISSIONS_WAITER))
    const go = labels(commands, 'go')

    expect(go).toContain('Pedidos')
    expect(go).not.toContain('Caja')
    expect(go).not.toContain('Personal')
    expect(labels(commands, 'actions')).toEqual([])
  })

  it('el encargado ve las acciones que su permiso permite y cada una navega con ?accion=', () => {
    const commands = commandsFor(buildAccount(PERMISSIONS_OWNER))
    const actions = commands.filter((command) => command.group === 'actions')

    expect(actions.map((command) => command.label)).toEqual(
      expect.arrayContaining(['Abrir caja', 'Nuevo plato', 'Nueva mesa', 'Datos fiscales']),
    )
    const openCash = actions.find((command) => command.label === 'Abrir caja')
    expect(openCash?.effect).toEqual({ type: 'navigate', to: '/caja?accion=abrir-caja' })
  })

  it('una cuenta con un solo permiso solo ve las acciones de ese permiso', () => {
    const commands = commandsFor(buildAccount(['menu.read', 'menu.manage']))

    expect(labels(commands, 'actions')).toEqual(['Nuevo plato', 'Nueva categoría'])
  })

  it('en la vista previa no hay cerrar sesión ni contraseña', () => {
    const commands = commandsFor(buildAccount(PERMISSIONS_OWNER, { preview: true }), { isPreview: true })

    expect(labels(commands, 'account')).toEqual(['Mi perfil'])
  })

  it('con sesión normal la cuenta ofrece perfil, contraseña y salida', () => {
    const commands = commandsFor(buildAccount(PERMISSIONS_OWNER))

    expect(labels(commands, 'account')).toEqual(['Mi perfil', 'Cambiar contraseña', 'Cerrar sesión'])
  })

  it('apariencia: modos, texto, alto contraste y más ajustes; marca el modo activo', () => {
    const commands = commandsFor(buildAccount(PERMISSIONS_WAITER))
    const appearance = commands.filter((command) => command.group === 'appearance')

    expect(appearance.map((command) => command.label)).toEqual([
      'Modo claro',
      'Modo oscuro',
      'Modo automático',
      'Texto más pequeño',
      'Texto más grande',
      'Activar el alto contraste',
      'Más ajustes de apariencia',
    ])
    expect(appearance.filter((command) => command.isActive === true).map((command) => command.label)).toEqual(['Modo automático'])
  })

  it('los ids son únicos', () => {
    const ids = commandsFor(buildAccount(PERMISSIONS_OWNER)).map((command) => command.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('las acciones de la lista cerrada', () => {
  it('cada una con permiso apunta a una pantalla del registro', () => {
    const paths = new Set(TEST_SCREENS.map((candidate) => candidate.path))
    const withPermission = SCREEN_ACTIONS.filter((action) => action.permission !== undefined)

    for (const action of withPermission) {
      expect(paths.has(action.screen)).toBe(true)
    }
  })
})
