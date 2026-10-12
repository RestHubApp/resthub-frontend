import { useEffect, useEffectEvent } from 'react'
import { useSearchParams } from 'react-router'

import { ACTION_PARAM, type ScreenActionId } from './screenActions'

/**
 * Abre el diálogo de una pantalla cuando la dirección lo pide
 * (`?accion=abrir-caja`).
 *
 * Solo reconoce el id que la pantalla declara en `SCREEN_ACTIONS`; cualquier
 * otro valor se ignora. Llama al mismo `open` que usa el botón, así que no
 * ejecuta nada por sí solo, y borra el parámetro (con `replace`) para que
 * «Atrás» y recargar no lo vuelvan a abrir.
 */
export function useScreenAction(id: ScreenActionId, open: () => void) {
  const [params, setParams] = useSearchParams()
  const requested = params.get(ACTION_PARAM)
  const consume = useEffectEvent((value: string | null) => {
    if (value !== id) {
      return
    }
    open()
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(ACTION_PARAM)
        return next
      },
      { replace: true },
    )
  })

  useEffect(() => {
    consume(requested)
  }, [requested])
}
