import { useRef } from 'react'

/**
 * Corre la acción elegida en un menú cuando el menú ya devolvió el foco a su
 * botón. Una ventana que la acción abre recuerda así ese botón (y no el
 * elemento del menú, que desaparece) y le devuelve el foco al cerrarse.
 */
export function useDeferredAction() {
  const chosen = useRef<(() => void) | null>(null)

  return {
    choose: (action: () => void) => {
      chosen.current = action
    },
    onCloseAutoFocus: () => {
      const action = chosen.current
      chosen.current = null
      // Radix devuelve el foco al botón justo después de este manejador.
      if (action !== null) {
        window.setTimeout(action, 0)
      }
    },
  }
}
