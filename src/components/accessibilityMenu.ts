// En el celular el boton flotante del widget se oculta (index.css): tapaba el
// "+" de los platos al tomar un pedido. El menu se abre desde "Más" con esto.

const WIDGET_BUTTON = '.asw-menu-btn'
// Cuánto se espera a que el widget recién importado dibuje su botón.
const WAIT_BUTTON_MS = 5000
const STEP_MS = 50

/**
 * Abre el menú del widget de accesibilidad como si se tocara su botón.
 *
 * El widget se carga unos segundos después de `load` (AccessibilityWidget.tsx).
 * Si la persona toca «Accesibilidad» antes, se importa en ese momento y el menú
 * se abre en cuanto aparece el botón: antes el toque no hacía nada.
 */
export function openAccessibilityMenu(): void {
  const button = document.querySelector<HTMLElement>(WIDGET_BUTTON)
  if (button) {
    button.click()
    return
  }
  void import('sienna-accessibility').then(() => {
    openWhenAppears(Date.now() + WAIT_BUTTON_MS)
  })
}

function openWhenAppears(limit: number): void {
  const button = document.querySelector<HTMLElement>(WIDGET_BUTTON)
  if (button) {
    button.click()
  } else if (Date.now() < limit) {
    window.setTimeout(() => {
      openWhenAppears(limit)
    }, STEP_MS)
  }
}

const LABEL = 'aria-label'
const TRANSLATIONS = new Map<string, string>([['Select Language', 'Elegir idioma']])

/** Pone `valor` en el atributo solo si cambió, para no volver a disparar al observer. */
function pin(element: Element, attribute: string, value: string): void {
  if (element.getAttribute(attribute) !== value) {
    element.setAttribute(attribute, value)
  }
}

/** El nombre de cada control es su `title`, que el widget sí traduce. */
function nameControls(menu: HTMLElement): void {
  for (const control of menu.querySelectorAll('[data-key][title]')) {
    pin(control, LABEL, control.getAttribute('title') ?? '')
  }
  for (const link of menu.querySelectorAll('a[aria-pressed]')) {
    link.removeAttribute('aria-pressed')
  }
}

/** Los textos que el widget deja en inglés. */
function translateRemaining(menu: HTMLElement): void {
  for (const control of menu.querySelectorAll(`[${LABEL}]`)) {
    const translated = TRANSLATIONS.get(control.getAttribute(LABEL) ?? '')
    if (translated !== undefined) {
      pin(control, LABEL, translated)
      pin(control, 'title', translated)
    }
  }
  for (const link of menu.querySelectorAll('a[aria-label^="Learn more about"]')) {
    const card = link.closest('.asw-card')?.querySelector('.asw-card-title')?.textContent.trim() ?? ''
    pin(link, LABEL, card === '' ? 'Más información' : `Más información sobre ${card}`)
    pin(link, 'title', 'Más información')
  }
}

/**
 * Corrige lo que el widget Sienna (2.2.333) deja mal en su menú:
 *
 * - Nombres en inglés: traduce el texto visible y el `title`, pero deja el
 *   `aria-label` en inglés («Line Height» sobre «Altura de línea»). El nombre
 *   que oye el lector de pantalla debe contener el texto visible (WCAG 2.5.3)
 *   y estar en el idioma de la página (3.1.2): se usa el `title` traducido.
 * - El lector de PDF es un enlace con `aria-pressed`, que un enlace no admite
 *   (axe: aria-allowed-attr, critical).
 * - El menú no está en ninguna región: se nombra como región propia (axe: region).
 */
export function repairAccessibilityMenu(menu: HTMLElement): void {
  pin(menu, 'role', 'region')
  pin(menu, LABEL, 'Menú de accesibilidad')
  nameControls(menu)
  translateRemaining(menu)
}
