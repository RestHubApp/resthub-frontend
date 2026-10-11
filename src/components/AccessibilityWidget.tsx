import { useEffect } from 'react'

import { ATTRIBUTES_LABEL, patchMenuButton, pinWidgetMenu } from './accessibilityWidgetPatches'

/**
 * Widget de accesibilidad Sienna (MIT, github.com/bennyluk/Sienna-Accessibility-Widget).
 *
 * El paquete se auto-inicializa como side-effect al importarse y corre en el
 * navegador del visitante, sin cuenta ni variable de entorno a diferencia de
 * UserWay. Se importa en su propio archivo, varios segundos después del
 * `load`: son 65 kB que la primera pantalla del celular no necesita para
 * dibujarse, y un `requestIdleCallback` los evaluaba en el primer hueco del
 * hilo, justo cuando Lighthouse mide el LCP. En el celular con sesión el
 * botón flotante se oculta (tapaba el "+" de los platos) y el
 * menú se abre desde "Más" (ver accessibilityMenu.ts). El paquete arma las URL de
 * su idioma y de la fuente de lectura contra cdn.jsdelivr.net; `vite.config.ts`
 * (`siennaAutoalojado`) las reescribe a `/sienna/` y publica esos archivos con
 * la aplicación, así que no hay tercero en ejecución ni hace falta abrirle la
 * CSP. Solo está el español: en otro idioma el widget cae al inglés. Sí pide
 * `style-src 'unsafe-inline'` (inyecta su hoja de estilos en el documento).
 *
 * Localización del botón:
 * En sienna-accessibility@2.2.333, la función Oe() crea el botón flotante
 * (`a.asw-menu-btn`) con `aria-label="Open Accessibility Menu"` y
 * `title="Open Accessibility Menu"` fijos en inglés, ignorando el idioma
 * del documento (`<html lang="es">`). Para garantizar WCAG 3.1.2 (idioma de las
 * partes) y WCAG 4.1.2 (nombre accesible correcto en lectores de pantalla),
 * este componente usa un MutationObserver acotado que localiza el botón a
 * 'Abrir menú de accesibilidad' tanto al montarse como ante cualquier
 * mutación del DOM.
 */
// Después del `load`, no en el primer hueco del hilo: el widget evalúa 65 kB
// y pide su idioma a un CDN. Ese trabajo, si cae en los primeros segundos,
// alarga el LCP y el TBT que Lighthouse simula con la CPU a 4×.
const WAIT_AFTER_LOAD_MS = 8000

declare global {
  interface Window {
    /** La pone el init script de Playwright. Lighthouse no la define. */
    __RESTHUB_E2E?: boolean
  }
}

/**
 * Corre `cargar` unos segundos después de `load`. Devuelve cómo cancelarlo.
 */
function whenLoadFinishes(load: () => void): () => void {
  let id = 0
  const schedule = () => {
    // Las pruebas E2E marcan la ventana: el menú tiene que existir dentro del
    // tiempo de expect (8 s). Lighthouse no pone esa marca, así que sigue
    // esperando y el widget no entra en la traza del LCP.
    const wait = window.__RESTHUB_E2E === true ? 0 : WAIT_AFTER_LOAD_MS
    id = window.setTimeout(load, wait)
  }
  if (document.readyState === 'complete') {
    schedule()
  } else {
    window.addEventListener('load', schedule, { once: true })
  }
  return () => {
    window.removeEventListener('load', schedule)
    window.clearTimeout(id)
  }
}

export function AccessibilityWidget() {
  useEffect(() => whenLoadFinishes(() => void import('sienna-accessibility')), [])

  useEffect(() => {
    const existing = document.querySelector('.asw-menu-btn')
    if (existing) {
      patchMenuButton(existing)
    }

    // El widget se importa después de montar y agrega su botón y su menú al
    // final de <body>: se observa <body> y no un contenedor que aún no existe.
    const observer = new MutationObserver(() => {
      const button = document.querySelector('.asw-menu-btn')
      if (button) {
        patchMenuButton(button)
      }
      pinWidgetMenu(document.querySelector<HTMLElement>('.asw-menu'))
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES_LABEL],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
