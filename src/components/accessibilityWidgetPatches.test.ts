import { afterEach, describe, expect, it } from '@jest/globals'

import { patchMenuButton, pinWidgetMenu } from './accessibilityWidgetPatches'

const ARIA_LABEL = 'aria-label'
const OPEN_LABEL = 'Abrir menú de accesibilidad'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('accessibilityWidgetPatches', () => {
  it('pone en español el nombre del botón flotante', () => {
    const button = document.createElement('a')
    button.setAttribute(ARIA_LABEL, 'Open Accessibility Menu')
    patchMenuButton(button)
    expect(button.getAttribute(ARIA_LABEL)).toBe(OPEN_LABEL)
    expect(button.getAttribute('title')).toBe(OPEN_LABEL)
  })

  it('fija la capa del menú, traduce el cierre y nombra las opciones por su texto', () => {
    document.body.innerHTML =
      '<div><div class="asw-menu"><button class="asw-menu-close" aria-label="Close"></button>' +
      '<button aria-label="High Contrast">Alto contraste</button></div></div>'
    const menu = document.querySelector<HTMLElement>('.asw-menu')
    pinWidgetMenu(menu)
    expect(menu?.parentElement?.style.display).toBe('block')
    expect(menu?.querySelector('.asw-menu-close')?.getAttribute(ARIA_LABEL)).toBe('Cerrar menú de accesibilidad')
    expect(menu?.querySelector('button[aria-label="Alto contraste"]')).not.toBeNull()
  })

  it('no hace nada si el menú aún no existe', () => {
    expect(() => { pinWidgetMenu(null) }).not.toThrow()
  })
})
