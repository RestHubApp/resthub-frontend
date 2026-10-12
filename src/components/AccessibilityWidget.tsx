import { useEffect, useState } from 'react'

import { Icon } from './Icon'
import { openAccessibilityMenu } from './accessibilityMenu'
import { ATTRIBUTES_LABEL, patchMenuButton, pinWidgetMenu } from './accessibilityWidgetPatches'

const WIDGET_BUTTON = '.asw-menu-btn'

/**
 * Widget de accesibilidad Sienna (MIT, github.com/bennyluk/Sienna-Accessibility-Widget).
 *
 * El paquete se auto-inicializa como side-effect al importarse y corre en el
 * navegador del visitante, sin cuenta ni variable de entorno a diferencia de
 * UserWay. Son 65 kB (20 kB por la red) que casi nadie usa, así que no se baja
 * hasta que alguien lo pide: la página dibuja un botón propio, igual al del
 * widget (`.a11y-launcher` en index.css), y al tocarlo se importa el paquete,
 * que dibuja el suyo, y se abre su menú (ver accessibilityMenu.ts). En cuanto
 * existe el botón del widget, el nuestro se retira. En el celular con sesión el
 * botón flotante se oculta (tapaba el "+" de los platos) y el menú se abre
 * desde "Más".
 *
 * El paquete arma las URL de su idioma y de la fuente de lectura contra
 * cdn.jsdelivr.net; `vite.config.ts`
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
export function AccessibilityWidget() {
  // El widget ya dibujó su botón (se cargó desde «Más» o antes de montar esto): el de reserva sobra.
  const [isLoaded, setIsLoaded] = useState(() => document.querySelector(WIDGET_BUTTON) !== null)

  useEffect(() => {
    const existing = document.querySelector(WIDGET_BUTTON)
    if (existing) {
      patchMenuButton(existing)
    }

    // El widget se importa al tocar el botón y agrega su botón y su menú al
    // final de <body>: se observa <body> y no un contenedor que aún no existe.
    const observer = new MutationObserver(() => {
      const button = document.querySelector(WIDGET_BUTTON)
      if (button) {
        patchMenuButton(button)
        setIsLoaded(true)
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

  if (isLoaded) {
    return null
  }
  return (
    <button
      type="button"
      data-a11y-launcher=""
      className="a11y-launcher"
      title="Abrir menú de accesibilidad"
      aria-label="Abrir menú de accesibilidad"
      aria-expanded="false"
      onClick={openAccessibilityMenu}
    >
      <Icon name="accessibility" size={24} />
    </button>
  )
}
