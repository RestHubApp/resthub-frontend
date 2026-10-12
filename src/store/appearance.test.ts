import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { ADMIN, signInToPlatform } from '#jest/fixtures/platform'
import { buildAccount, PERMISSIONS_WAITER } from '#jest/harness'
import { DEFAULT_APPEARANCE } from '@/services/appearanceRules'
import { appearanceKey } from '@/services/appearanceStorage'
import { useAppearance } from './appearance'
import { useSession } from './session'

const DEFAULT_THEME = 'terracotta'
const THEME_ATTRIBUTE = 'data-theme'
const KEY = 'resthub.appearance.v1.staff.7'

function root(): HTMLElement {
  return document.documentElement
}

function signIn(userId: number) {
  const base = buildAccount(PERMISSIONS_WAITER)
  const account = { ...base, user: { ...base.user, id: userId } }
  useSession.setState({ token: `token-${String(userId)}`, account })
  return account
}

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia')

/** El aparato está en modo oscuro o claro: lo que contesta `matchMedia`. */
function mockDarkMode(isDark: boolean) {
  const answer = (query: string) => ({ matches: isDark, media: query, addEventListener: () => undefined }) as unknown as MediaQueryList
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: answer })
}

afterEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
  if (ORIGINAL_MATCH_MEDIA !== undefined) {
    Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA)
  }
})

describe('preferencias de apariencia', () => {
  it('sin sesión rigen las de fábrica y nada se guarda', () => {
    useSession.setState({ token: null, account: null })
    useAppearance.getState().change({ theme: 'night' })

    expect(localStorage).toHaveLength(0)
    useAppearance.getState().reset()
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, DEFAULT_THEME)
  })

  it('al cambiar se aplican a la página y se guardan para la cuenta, con la clave de su tipo e id', () => {
    const account = signIn(7)
    useAppearance.getState().change({ theme: 'night', font: 'atkinson', textSize: 'large' })

    expect(appearanceKey(account)).toBe(KEY)
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, 'night')
    expect(root()).toHaveAttribute('data-font', 'atkinson')
    expect(root()).toHaveAttribute('data-text-size', 'large')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ version: 1, theme: 'night', font: 'atkinson', textSize: 'large' })
  })

  it('cada cuenta tiene las suyas: al entrar otra se cargan las de ella', () => {
    signIn(7)
    useAppearance.getState().change({ theme: 'wine' })

    signIn(8)
    expect(useAppearance.getState().appearance).toEqual(DEFAULT_APPEARANCE)
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, DEFAULT_THEME)
    useAppearance.getState().change({ theme: 'slate' })

    signIn(7)
    expect(useAppearance.getState().appearance.theme).toBe('wine')
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, 'wine')
  })

  it('la cuenta de plataforma y la de un local con el mismo número no se pisan', () => {
    signInToPlatform(undefined, { ...ADMIN, id: 7 })
    useAppearance.getState().change({ theme: 'olive' })
    signIn(7)

    expect(useAppearance.getState().appearance.theme).toBe(DEFAULT_THEME)
    expect(localStorage.getItem('resthub.appearance.v1.platform.7')).toContain('olive')
  })

  it('al cerrar la sesión la pantalla de acceso vuelve al tema de fábrica', () => {
    signIn(7)
    useAppearance.getState().change({ theme: 'night' })

    useSession.setState({ token: null, account: null })

    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, DEFAULT_THEME)
    expect(useAppearance.getState().appearance).toEqual(DEFAULT_APPEARANCE)
    // Lo guardado de la cuenta sigue ahí para cuando vuelva a entrar.
    expect(localStorage.getItem(KEY)).toContain('night')
  })

  it('lo guardado roto o de otra versión se ignora al cargar la cuenta', () => {
    localStorage.setItem(KEY, '{roto')
    signIn(7)

    expect(useAppearance.getState().appearance).toEqual(DEFAULT_APPEARANCE)
  })

  it('«Según el sistema» pinta Noche si el aparato está en oscuro', () => {
    mockDarkMode(true)
    signIn(7)
    useAppearance.getState().change({ theme: 'system' })

    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, 'night')

    mockDarkMode(false)
    useAppearance.getState().change({ theme: 'system' })
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, DEFAULT_THEME)
  })

  it('sin poder leer ni escribir el almacenamiento sigue funcionando en memoria', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('lleno')
    })
    signIn(7)
    useAppearance.getState().change({ theme: 'contrast' })

    expect(useAppearance.getState().appearance.theme).toBe('contrast')
    expect(root()).toHaveAttribute(THEME_ATTRIBUTE, 'contrast')
  })

  it('«Restablecer» vuelve a lo de fábrica y lo guarda', () => {
    signIn(7)
    useAppearance.getState().change({ theme: 'night', menu: { order: ['/cocina'], bottom: null } })
    useAppearance.getState().reset()

    expect(useAppearance.getState().appearance).toEqual(DEFAULT_APPEARANCE)
    expect(localStorage.getItem(KEY)).toContain(DEFAULT_THEME)
  })
})
