import { useRef } from 'react'

/**
 * Devuelve el foco a quien abrió una ventana que se abre desde estado.
 *
 * Radix solo sabe devolver el foco al disparador que él mismo conoce. Una
 * ventana abierta desde un menú o un botón con estado recuerda qué lo tenía al
 * abrir y se lo devuelve al cerrar: quien usa teclado vuelve al botón y no al
 * inicio de la página.
 */
export function useReturnFocus(onOpen?: () => void) {
  const target = useRef<HTMLElement | null>(null)

  return {
    onOpenAutoFocus: () => {
      target.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpen?.()
    },
    onCloseAutoFocus: (event: Event) => {
      if (target.current?.isConnected === true) {
        event.preventDefault()
        target.current.focus()
      }
    },
  }
}
