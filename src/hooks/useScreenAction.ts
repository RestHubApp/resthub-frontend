import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import { ACTION_PARAM, type ScreenActionId } from './screenActions'

interface ScreenActionOptions {
  /** Falso si la acción no aplica ahora (la caja ya está abierta); el parámetro se borra solo. */
  readonly isApplicable?: boolean
}

/**
 * Si la dirección pide abrir el diálogo de una pantalla (`?accion=abrir-caja`).
 *
 * Solo reconoce el id que la pantalla declara en `SCREEN_ACTIONS`; cualquier
 * otro valor se ignora. No ejecuta nada y no lee datos del parámetro: la
 * pantalla abre el mismo diálogo vacío de su botón (`isRequested`) y, al
 * cerrarlo, llama a `clear` para borrar el parámetro de la dirección (con
 * `replace`, así «Atrás» no lo vuelve a abrir).
 *
 * Si la acción no aplica en este momento (la caja ya está abierta, la cuenta
 * no cambia su contraseña), `isApplicable` es falso: no se pide el diálogo y
 * el parámetro se borra solo, para que la dirección no se quede pidiendo algo
 * que no va a pasar.
 */
export function useScreenAction(id: ScreenActionId, { isApplicable = true }: ScreenActionOptions = {}) {
  const [params, setParams] = useSearchParams()
  const isRequested = params.get(ACTION_PARAM) === id

  const clear = () => {
    if (!isRequested) {
      return
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(ACTION_PARAM)
        return next
      },
      { replace: true },
    )
  }

  const shouldDrop = isRequested && !isApplicable
  // Cambiar la dirección es un efecto con el exterior (el historial), y el router solo lo admite tras montarse: no se puede hacer al dibujar.
  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- sincroniza la dirección con una condición de la pantalla, no responde a un evento
    if (!shouldDrop) {
      return
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(ACTION_PARAM)
        return next
      },
      { replace: true },
    )
  }, [shouldDrop, setParams])

  return { isRequested: isRequested && isApplicable, clear }
}
