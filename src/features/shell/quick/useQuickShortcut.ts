import { useEffect } from 'react'

import { useQuickPalette } from './quickState'

/**
 * Si la tecla es Ctrl+K (Windows y Linux) o Cmd+K (Mac), sola: sin Alt (en los
 * teclados en español Ctrl+Alt es AltGr y escribe `@`, `\` o `{`) ni Mayús.
 */
function isQuickShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
}

/**
 * El único atajo global de la aplicación: Ctrl/Cmd+K abre y cierra la paleta.
 *
 * Lleva tecla modificadora, así que no choca con escribir, y funciona también
 * con el foco en un campo de texto (el navegador lo usa para buscar en la
 * barra, y la paleta lo reemplaza dentro de la aplicación). No hay atajos de
 * una sola letra. Se ignora mientras otra confirmación está abierta.
 */
export function useQuickShortcut(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || !isQuickShortcut(event)) {
        return
      }
      if (document.querySelector('[role="alertdialog"]') !== null) {
        return
      }
      event.preventDefault()
      useQuickPalette.getState().toggle()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
