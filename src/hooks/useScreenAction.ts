import { useSearchParams } from 'react-router'

import { ACTION_PARAM, type ScreenActionId } from './screenActions'

/**
 * Si la dirección pide abrir el diálogo de una pantalla (`?accion=abrir-caja`).
 *
 * Solo reconoce el id que la pantalla declara en `SCREEN_ACTIONS`; cualquier
 * otro valor se ignora. No ejecuta nada y no lee datos del parámetro: la
 * pantalla abre el mismo diálogo vacío de su botón (`isRequested`) y, al
 * cerrarlo, llama a `clear` para borrar el parámetro de la dirección (con
 * `replace`, así «Atrás» no lo vuelve a abrir).
 */
export function useScreenAction(id: ScreenActionId) {
  const [params, setParams] = useSearchParams()
  const isRequested = params.get(ACTION_PARAM) === id

  return {
    isRequested,
    clear: () => {
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
    },
  }
}
