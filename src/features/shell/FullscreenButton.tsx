import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { ShellIcon } from './ShellIcon'

function subscribe(listener: () => void): () => void {
  document.addEventListener('fullscreenchange', listener)
  return () => {
    document.removeEventListener('fullscreenchange', listener)
  }
}

function isFullscreen(): boolean {
  return (document.fullscreenElement ?? null) !== null
}

function toggleFullscreen(): void {
  // Si el navegador lo niega (sin un gesto válido, una política), no pasa nada:
  // el botón refleja `fullscreenchange`, no lo que se pidió.
  const request = isFullscreen() ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  request.catch(() => undefined)
}

/**
 * El botón cuadrado «Pantalla completa» del pie de la barra lateral: esconde
 * las barras del navegador en la laptop de la caja o del tablero. Donde la
 * página no puede pedirla (el iPhone, una PWA instalada) no aparece.
 */
export function FullscreenButton() {
  const isActive = useSyncExternalStore(subscribe, isFullscreen, () => false)
  // `fullscreenEnabled` falta en Safari del iPhone: se lee como `false`.
  if ((document.fullscreenEnabled as boolean | undefined) !== true) {
    return null
  }
  const label = isActive ? 'Salir de pantalla completa' : 'Pantalla completa'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      onClick={toggleFullscreen}
    >
      <ShellIcon name={isActive ? 'exitFullscreen' : 'fullscreen'} size={20} />
    </Button>
  )
}
