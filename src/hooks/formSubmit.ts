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

// Los campos que se pueden enfocar, en el orden en que se ven.
const FIELDS = 'input[name]:not([type=hidden]), select[name], textarea[name]'

/**
 * Enfoca el primer campo con error, en el orden en que se ven, una sola vez.
 *
 * La usa `useAppForm` como `onInvalid` de `handleSubmit`; ver ahí por qué
 * react-hook-form no se encarga. Busca dentro del formulario enviado; si el
 * envío no vino de un evento, en toda la página.
 */
export function focusFirstError(errors: FieldErrors, event?: BaseSyntheticEvent): void {
  const target: unknown = event?.target
  const scope: ParentNode = target instanceof HTMLFormElement ? target : document
  const first = Array.from(scope.querySelectorAll<HTMLElement>(FIELDS)).find((element) => {
    const name = element.getAttribute('name')
    return name !== null && get(errors, name) !== undefined
  })
  first?.focus()
}
