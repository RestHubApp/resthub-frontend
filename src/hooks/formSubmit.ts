import type { BaseSyntheticEvent, SyntheticEvent } from 'react'
import { type FieldErrors, get } from 'react-hook-form'

/**
 * Adapta el manejador de react-hook-form al atributo `onSubmit`.
 *
 * `handleSubmit` devuelve una promesa y el atributo espera algo que no
 * devuelva nada. Pasarlo directo es un error real: nadie espera esa promesa,
 * asi que un fallo dentro del envio se pierde en silencio. Este envoltorio
 * marca la promesa como deliberadamente ignorada en un solo lugar.
 *
 * Se tipa con `SyntheticEvent` y no con `FormEvent` porque los tipos de React
 * marcaron el segundo como obsoleto.
 */
export function onSubmit(
  handler: (event: SyntheticEvent<HTMLFormElement>) => Promise<unknown>,
): (event: SyntheticEvent<HTMLFormElement>) => void {
  return (event) => {
    void handler(event)
  }
}

/**
 * Enfoca el primer campo con error, en el orden en que se ven, una sola vez.
 *
 * Va como `onInvalid` de `handleSubmit`, con `shouldFocusError: false` en
 * `useForm`. react-hook-form, por su cuenta, enfoca el primer campo con error
 * y vuelve a hacerlo en un `setTimeout`. Si para entonces la persona ya corrigió
 * ese campo y pasó al siguiente, el segundo intento le quita el foco y lo manda
 * a otro campo con error: lo que escribía cae ahí (GES-23: el teléfono terminaba
 * en «Personas» y la reserva se guardaba sin él).
 */
export function focusFirstError(errors: FieldErrors, event?: BaseSyntheticEvent): void {
  const form: unknown = event?.target
  if (!(form instanceof HTMLFormElement)) {
    return
  }
  const first = Array.from(form.elements).find((element) => {
    const name = element.getAttribute('name')
    return name !== null && get(errors, name) !== undefined
  })
  if (first instanceof HTMLElement) {
    first.focus()
  }
}
