import { afterEach, describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, signInAs, TEST_SCREENS } from '#jest/harness'
import type { PermissionCode } from '@/api/types'
import { DEFAULT_APPEARANCE } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { ShellScreensContext } from '@/features/shell/shellScreens'
import { AppearanceView } from './AppearanceView'

const KEY = 'resthub.appearance.v1.staff.7'
const THEME = 'data-theme'

function openAppearance(permissions: readonly PermissionCode[] = PERMISSIONS_WAITER) {
  signInAs(permissions)
  return mountScreen(
    <ShellScreensContext value={TEST_SCREENS}>
      <AppearanceView />
    </ShellScreensContext>,
    { path: '/perfil/apariencia' },
  )
}

async function openTab(user: ReturnType<typeof openAppearance>['user'], name: string) {
  await user.click(screen.getByRole('tab', { name }))
}

/** Las pantallas de un grupo del menú, en el orden en que la lista las muestra. */
function groupOrder(title: RegExp | string): string[] {
  const list = screen.queryByRole('list', { name: title })
  if (list === null) {
    return []
  }
  return within(list)
    .getAllByRole('listitem')
    .map((item) => within(item).getByRole('button', { name: /^Acciones de / }).getAttribute('aria-label')?.replace('Acciones de ', '') ?? '')
}

function pathOf(label: string): string | undefined {
  return TEST_SCREENS.find((entry) => entry.nav?.label === label)?.path
}

async function chooseFromMenu(user: ReturnType<typeof openAppearance>['user'], label: string, action: string) {
  await user.click(screen.getByRole('button', { name: `Acciones de ${label}` }))
  await user.click(await screen.findByRole('menuitem', { name: action }))
  // La acción corre cuando el menú ya se cerró y devolvió el foco.
  await waitFor(() => {
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
}

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia')

/** El dispositivo contesta que sí a las consultas de medios que `answers` acepta. */
function mockMedia(answers: (query: string) => boolean) {
  const answer = (query: string) => ({ matches: answers(query), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: answer })
}

const BAR = /^En la barra de abajo/u
const MORE = 'En «Más»'

afterEach(() => {
  localStorage.clear()
  if (ORIGINAL_MATCH_MEDIA !== undefined) {
    Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA)
  }
  useAppearance.getState().reset()
})

describe('AppearanceView: pestaña Pantalla', () => {
  it('ofrece tres modos y cuatro colores, con «Claro» y Terracota elegidos, y el alto contraste apagado', () => {
    openAppearance()

    expect(screen.getAllByRole('radio', { name: /Claro|Oscuro|Automático/u })).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeChecked()
    expect(screen.getAllByRole('radio', { name: /Terracota|Oliva|Pizarra|Vino/u })).toHaveLength(4)
    expect(screen.getByRole('radio', { name: /Terracota/u })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Alto contraste/u })).not.toBeChecked()
  })

  it('el modo automático se llama como lo entiende la gente y no menciona «sistema» ni «aparato»', () => {
    openAppearance()

    expect(screen.getByRole('radio', { name: 'Automático (como tu celular o computadora)' })).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/aparato|Según el sistema/u)
  })

  it('elegir «Oscuro» lo aplica al instante, conserva el color y lo guarda para la cuenta', async () => {
    const { user } = openAppearance()

    await user.click(screen.getByRole('radio', { name: /Oliva/u }))
    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))

    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
    expect(document.documentElement).toHaveAttribute(THEME, 'olive-dark')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ version: 2, mode: 'dark', accent: 'olive' })
  })

  it('cada color tiene su variante clara y su variante oscura', async () => {
    const { user } = openAppearance()

    for (const [name, accent] of [[/Pizarra/u, 'slate'], [/Vino/u, 'wine'], [/Terracota/u, 'terracotta']] as const) {
      await user.click(screen.getByRole('radio', { name }))
      await user.click(screen.getByRole('radio', { name: 'Claro' }))
      expect(document.documentElement).toHaveAttribute(THEME, accent)
      await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
      expect(document.documentElement).toHaveAttribute(THEME, `${accent}-dark`)
    }
  })

  it('«Automático» sigue al dispositivo con el color elegido', async () => {
    mockMedia((query) => query.includes('dark'))
    const { user } = openAppearance()

    await user.click(screen.getByRole('radio', { name: /Vino/u }))
    await user.click(screen.getByRole('radio', { name: /^Automático/u }))

    expect(document.documentElement).toHaveAttribute(THEME, 'wine-dark')
  })

  it('el alto contraste es un interruptor aparte: manda sobre el color y respeta el modo', async () => {
    const { user } = openAppearance()

    await user.click(screen.getByRole('checkbox', { name: /Alto contraste/u }))
    expect(document.documentElement).toHaveAttribute(THEME, 'contrast')
    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement).toHaveAttribute(THEME, 'contrast-dark')

    await user.click(screen.getByRole('checkbox', { name: /Alto contraste/u }))
    expect(document.documentElement).toHaveAttribute(THEME, 'terracotta-dark')
  })

  it('la vista previa «Así se ve» se queda arriba con una descripción para el lector de pantalla', () => {
    openAppearance()

    expect(screen.getByRole('img', { name: /Vista previa/u })).toBeInTheDocument()
  })
})

describe('AppearanceView: pestaña Lectura', () => {
  it('ofrece cuatro tamaños de texto, hasta 150 %, y elegir uno lo aplica a la página', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Lectura')

    expect(screen.getAllByRole('radio', { name: /^(Normal|Grande|Muy grande|Enorme) \(/u })).toHaveLength(4)
    await user.click(screen.getByRole('radio', { name: 'Enorme (150 %)' }))

    expect(document.documentElement).toHaveAttribute('data-text-size', 'largest')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ textSize: 'largest' })
  })

  it('elegir la letra la aplica a la página', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Lectura')

    await user.click(screen.getByRole('radio', { name: 'Atkinson' }))

    expect(document.documentElement).toHaveAttribute('data-font', 'atkinson')
  })

  it('con el dedo no se ofrece la densidad: los controles miden siempre 44 px', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Lectura')

    expect(screen.queryByRole('radio', { name: 'Compacta' })).not.toBeInTheDocument()
  })

  it('con ratón se ofrece la densidad y elegirla se aplica y se guarda', async () => {
    mockMedia((query) => query === '(pointer: fine)')
    const { user } = openAppearance()
    await openTab(user, 'Lectura')

    expect(screen.getByRole('radio', { name: 'Cómoda' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Compacta' }))

    expect(document.documentElement).toHaveAttribute('data-density', 'compact')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ density: 'compact' })
  })

  it('hay un solo control de tamaño de texto y un acceso a los demás ajustes de accesibilidad', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Lectura')

    expect(screen.getAllByRole('group', { name: 'Tamaño del texto' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Más ajustes de accesibilidad' })).toBeInTheDocument()
  })
})

describe('AppearanceView: pestaña Menú', () => {
  it('lista solo lo que el mesero puede abrir, repartido entre la barra de abajo y «Más»', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Menú')

    const all = [...groupOrder(BAR), ...groupOrder(MORE)]
    expect(all).toEqual(expect.arrayContaining(['Pedidos', 'Cocina', 'Reservas', 'Clientes']))
    expect(all).not.toContain('Caja')
    expect(all).not.toContain('Personal')
  })

  it('«Bajar» y «Subir» del «⋯» reordenan dentro del grupo, se anuncia el lugar y el orden se guarda', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Menú')
    const [first = '', second = ''] = groupOrder(BAR)

    await chooseFromMenu(user, first, 'Bajar')

    expect(groupOrder(BAR).slice(0, 2)).toEqual([second, first])
    expect(screen.getAllByRole('status').some((node) => node.textContent === `${first}: lugar 2 de ${String(groupOrder(BAR).length)} en la barra de abajo.`)).toBe(true)
    const stored = useAppearance.getState().appearance.menu.order
    expect(stored.indexOf(pathOf(second) ?? '')).toBeLessThan(stored.indexOf(pathOf(first) ?? ''))

    await chooseFromMenu(user, first, 'Subir')
    expect(groupOrder(BAR).slice(0, 2)).toEqual([first, second])
  })

  it('subir la primera o bajar la última no se puede', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Menú')
    const bar = groupOrder(BAR)

    await user.click(screen.getByRole('button', { name: `Acciones de ${bar[0] ?? ''}` }))
    expect(await screen.findByRole('menuitem', { name: 'Subir' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('cada fila tiene un asa de arrastre con nombre, además del «⋯»', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Menú')
    const [first = ''] = groupOrder(BAR)

    expect(screen.getByRole('button', { name: `Arrastrar ${first}` })).toBeInTheDocument()
  })

  it('con la barra llena no se puede poner otra, y quitar una libera el lugar', async () => {
    const { user } = openAppearance(PERMISSIONS_OWNER)
    await openTab(user, 'Menú')

    expect(screen.getByRole('list', { name: /4 de 4/u })).toBeInTheDocument()
    expect(screen.getByText('Está llena: quita una para poner otra.')).toBeInTheDocument()
    const [outside = ''] = groupOrder(MORE)
    await user.click(screen.getByRole('button', { name: `Acciones de ${outside}` }))
    expect(await screen.findByRole('menuitem', { name: 'Poner en la barra de abajo' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Escape}')

    const [inside = ''] = groupOrder(BAR)
    await chooseFromMenu(user, inside, 'Quitar de la barra de abajo')

    expect(screen.getByRole('list', { name: /3 de 4/u })).toBeInTheDocument()
    expect(groupOrder(MORE)).toContain(inside)
    expect(useAppearance.getState().appearance.menu.bottom).toHaveLength(3)
    await chooseFromMenu(user, outside, 'Poner en la barra de abajo')
    expect(groupOrder(BAR)).toContain(outside)
  })

  it('la barra de muestra enseña los cuatro lugares y avisa cuáles están libres', async () => {
    const { user } = openAppearance()
    await openTab(user, 'Menú')
    const [first = ''] = groupOrder(BAR)
    await chooseFromMenu(user, first, 'Quitar de la barra de abajo')

    expect(screen.getAllByText('Libre', { selector: 'span' }).length).toBeGreaterThan(0)
  })
})

describe('AppearanceView: restablecer', () => {
  it('hay un solo botón y vuelve el modo, el color, la letra, el tamaño y el menú a lo de fábrica', async () => {
    const { user } = openAppearance()
    await user.click(screen.getByRole('radio', { name: /Vino/u }))
    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
    await openTab(user, 'Menú')
    const [first = ''] = groupOrder(BAR)
    await chooseFromMenu(user, first, 'Bajar')
    expect(screen.getAllByRole('button', { name: /^Restablecer/u })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Restablecer apariencia' }))

    expect(useAppearance.getState().appearance).toEqual(DEFAULT_APPEARANCE)
    expect(document.documentElement).toHaveAttribute(THEME, 'terracotta')
  })
})
