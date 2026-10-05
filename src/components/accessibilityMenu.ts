// En el celular el boton flotante del widget se oculta (index.css): tapaba el
// "+" de los platos al tomar un pedido. El menu se abre desde "Más" con esto.

const BOTON_DEL_WIDGET = '.asw-menu-btn'
// Cuánto se espera a que el widget recién importado dibuje su botón.
const ESPERA_BOTON_MS = 5000
const PASO_MS = 50

/**
 * Abre el menú del widget de accesibilidad como si se tocara su botón.
 *
 * El widget se carga unos segundos después de `load` (AccessibilityWidget.tsx).
 * Si la persona toca «Accesibilidad» antes, se importa en ese momento y el menú
 * se abre en cuanto aparece el botón: antes el toque no hacía nada.
 */
export function openAccessibilityMenu(): void {
  const boton = document.querySelector<HTMLElement>(BOTON_DEL_WIDGET)
  if (boton) {
    boton.click()
    return
  }
  void import('sienna-accessibility').then(() => {
    abrirCuandoAparezca(Date.now() + ESPERA_BOTON_MS)
  })
}

function abrirCuandoAparezca(limite: number): void {
  const boton = document.querySelector<HTMLElement>(BOTON_DEL_WIDGET)
  if (boton) {
    boton.click()
  } else if (Date.now() < limite) {
    window.setTimeout(() => {
      abrirCuandoAparezca(limite)
    }, PASO_MS)
  }
}

const ETIQUETA = 'aria-label'
const TRADUCCIONES = new Map<string, string>([['Select Language', 'Elegir idioma']])

/** Pone `valor` en el atributo solo si cambió, para no volver a disparar al observer. */
function fijar(elemento: Element, atributo: string, valor: string): void {
  if (elemento.getAttribute(atributo) !== valor) {
    elemento.setAttribute(atributo, valor)
  }
}

/** El nombre de cada control es su `title`, que el widget sí traduce. */
function nombrarControles(menu: HTMLElement): void {
  for (const control of menu.querySelectorAll('[data-key][title]')) {
    fijar(control, ETIQUETA, control.getAttribute('title') ?? '')
  }
  for (const enlace of menu.querySelectorAll('a[aria-pressed]')) {
    enlace.removeAttribute('aria-pressed')
  }
}

/** Los textos que el widget deja en inglés. */
function traducirRestantes(menu: HTMLElement): void {
  for (const control of menu.querySelectorAll(`[${ETIQUETA}]`)) {
    const traducida = TRADUCCIONES.get(control.getAttribute(ETIQUETA) ?? '')
    if (traducida) {
      fijar(control, ETIQUETA, traducida)
      fijar(control, 'title', traducida)
    }
  }
  for (const enlace of menu.querySelectorAll('a[aria-label^="Learn more about"]')) {
    const tarjeta = enlace.closest('.asw-card')?.querySelector('.asw-card-title')?.textContent.trim() ?? ''
    fijar(enlace, ETIQUETA, tarjeta === '' ? 'Más información' : `Más información sobre ${tarjeta}`)
    fijar(enlace, 'title', 'Más información')
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
  fijar(menu, 'role', 'region')
  fijar(menu, ETIQUETA, 'Menú de accesibilidad')
  nombrarControles(menu)
  traducirRestantes(menu)
}
