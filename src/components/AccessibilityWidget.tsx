import { useEffect } from 'react'

import { repairAccessibilityMenu } from './accessibilityMenu'

const ETIQUETA_ESPANOL = 'Abrir menú de accesibilidad'
const ETIQUETA_CERRAR = 'Cerrar menú de accesibilidad'
const ARIA_LABEL = 'aria-label'
const ATRIBUTOS_ETIQUETA = [ARIA_LABEL, 'title'] as const

/**
 * Widget de accesibilidad Sienna (MIT, github.com/bennyluk/Sienna-Accessibility-Widget).
 *
 * El paquete se auto-inicializa como side-effect al importarse y corre en el
 * navegador del visitante, sin cuenta ni variable de entorno a diferencia de
 * UserWay. Se importa en su propio archivo, después del `load` y en un
 * momento ocioso: son 65 kB que la primera pantalla del celular no necesita
 * para dibujarse. En el celular
 * con sesión el botón flotante se oculta (tapaba el "+" de los platos) y el
 * menú se abre desde "Más" (ver accessibilityMenu.ts). Sí hace una llamada externa: publica el locale de cada idioma y la
 * fuente de lectura en cdn.jsdelivr.net y los descarga de ahí (el tarball los
 * trae, pero el paquete arma las URL contra el CDN). Aceptamos ese CDN; si
 * está bloqueado, el widget cae al inglés. Al definir una CSP hay que permitir
 * `connect-src` y `font-src https://cdn.jsdelivr.net` y `style-src
 * 'unsafe-inline'` (inyecta su hoja de estilos en el documento).
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
// Tope de espera del momento ocioso: en una pantalla que nunca queda quieta
// (el tablero en vivo), el widget igual aparece.
const IDLE_TIMEOUT_MS = 2000

/**
 * Corre `cargar` después del evento `load` y en un momento ocioso. El widget
 * son 65 kB que se evalúan en el hilo principal: bajarlo mientras la pantalla
 * se dibuja retrasaba el primer render en el celular (Lighthouse, TBT y LCP).
 * Devuelve cómo cancelarlo.
 */
function cuandoTermineDeCargar(cargar: () => void): () => void {
  let cancelar: () => void = () => undefined
  const programar = () => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(cargar, { timeout: IDLE_TIMEOUT_MS })
      cancelar = () => {
        window.cancelIdleCallback(id)
      }
      return
    }
    const id = setTimeout(cargar, IDLE_TIMEOUT_MS / 4)
    cancelar = () => {
      clearTimeout(id)
    }
  }
  if (document.readyState === 'complete') {
    programar()
  } else {
    window.addEventListener('load', programar, { once: true })
  }
  return () => {
    window.removeEventListener('load', programar)
    cancelar()
  }
}

export default function AccessibilityWidget() {
  useEffect(() => cuandoTermineDeCargar(() => void import('sienna-accessibility')), [])

  useEffect(() => {
    function parchearBoton(boton: Element) {
      // Solo escribe si cambió: así el propio parche no vuelve a disparar el observer.
      for (const atributo of ATRIBUTOS_ETIQUETA) {
        if (boton.getAttribute(atributo) !== ETIQUETA_ESPANOL) {
          boton.setAttribute(atributo, ETIQUETA_ESPANOL)
        }
      }
    }

    const existente = document.querySelector('.asw-menu-btn')
    if (existente) {
      parchearBoton(existente)
    }

    // El widget crea su menú la primera vez que se abre, visible pero sin
    // `display` en línea, y su botón de cerrar alterna ese valor: el primer
    // toque en la X lo pasaba a "block" y el menú seguía abierto. Se deja
    // escrito para que el primer cierre funcione. Su X, además, se anuncia en
    // inglés ("Close").
    function fijarMenu(menu: HTMLElement | null) {
      const capa = menu?.parentElement
      if (capa?.style.display === '') {
        capa.style.display = 'block'
      }
      const cerrar = menu?.querySelector('.asw-menu-close')
      if (cerrar && cerrar.getAttribute(ARIA_LABEL) !== ETIQUETA_CERRAR) {
        cerrar.setAttribute(ARIA_LABEL, ETIQUETA_CERRAR)
      }
      if (menu) {
        repairAccessibilityMenu(menu)
      }
    }

    // El widget se importa después de montar y agrega su botón y su menú al
    // final de <body>: se observa <body> y no un contenedor que aún no existe.
    const observer = new MutationObserver(() => {
      const boton = document.querySelector('.asw-menu-btn')
      if (boton) {
        parchearBoton(boton)
      }
      fijarMenu(document.querySelector<HTMLElement>('.asw-menu'))
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...ATRIBUTOS_ETIQUETA],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
