import { repairAccessibilityMenu } from './accessibilityMenu'

const LABEL_SPANISH = 'Abrir menú de accesibilidad'
const LABEL_CLOSE = 'Cerrar menú de accesibilidad'
const ARIA_LABEL = 'aria-label'

/** Atributos que el widget fija en inglés y que se observan para corregirlos. */
export const ATTRIBUTES_LABEL = [ARIA_LABEL, 'title'] as const

/** Localiza al español el botón flotante del widget. */
export function patchMenuButton(button: Element): void {
  // Solo escribe si cambió: así el propio parche no vuelve a disparar el observer.
  for (const attribute of ATTRIBUTES_LABEL) {
    if (button.getAttribute(attribute) !== LABEL_SPANISH) {
      button.setAttribute(attribute, LABEL_SPANISH)
    }
  }
}

/**
 * Las opciones muestran su texto en español («Alto contraste») pero el
 * widget les deja un `aria-label` fijo en inglés («High Contrast»): un
 * lector de pantalla o el control por voz no las encuentran por lo que se
 * ve (WCAG 2.5.3). El nombre pasa a ser el texto visible.
 */
function nameOptions(menu: HTMLElement | null): void {
  for (const option of menu?.querySelectorAll('button[aria-label]') ?? []) {
    const visible = option.textContent.trim()
    if (visible !== '' && option.getAttribute(ARIA_LABEL) !== visible) {
      option.setAttribute(ARIA_LABEL, visible)
    }
  }
}

/**
 * El widget crea su menú la primera vez que se abre, visible pero sin
 * `display` en línea, y su botón de cerrar alterna ese valor: el primer
 * toque en la X lo pasaba a "block" y el menú seguía abierto. Se deja
 * escrito para que el primer cierre funcione. Su X, además, se anuncia en
 * inglés ("Close").
 */
export function pinWidgetMenu(menu: HTMLElement | null): void {
  const layer = menu?.parentElement
  if (layer?.style.display === '') {
    layer.style.display = 'block'
  }
  const close = menu?.querySelector('.asw-menu-close')
  if (close && close.getAttribute(ARIA_LABEL) !== LABEL_CLOSE) {
    close.setAttribute(ARIA_LABEL, LABEL_CLOSE)
  }
  if (menu) {
    repairAccessibilityMenu(menu)
  }
  nameOptions(menu)
}
