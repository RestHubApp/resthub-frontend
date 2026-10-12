import { DialogFormActions } from './DialogFormActions'
import { FormMessage } from './FormMessage'
import { FormSubmitButton, type FooterSubmit } from './FormSubmitButton'
import { Button } from './ui/button'
import { mutationErrorText } from '@/hooks/mutationErrorText'

/** Lo que el pie necesita saber de lo que guarda: si está en curso y, si falló, por qué. */
interface FooterMutation {
  readonly isPending: boolean
  readonly isError?: boolean
  readonly error?: unknown
}

interface FormFooterProps {
  readonly mutation: FooterMutation
  /**
   * El mensaje cuando el error no trae uno propio del servidor. Sin él, el pie no
   * muestra error: el formulario ya lo muestra aparte.
   */
  readonly failureText?: string
  readonly onCancel: () => void
  /** «Cancelar» por omisión; «Volver» o «Cerrar» cuando eso dice mejor qué pasa. */
  readonly cancelLabel?: string
  /** La acción principal. Sin ella (formulario de solo lectura) queda únicamente el botón de cerrar. */
  readonly submit?: FooterSubmit | undefined
  /** En una grilla de dos columnas, el pie ocupa las dos. */
  readonly spansColumns?: boolean
}

function failureOf(mutation: FooterMutation, failureText: string | undefined): string | null {
  return failureText === undefined ? null : mutationErrorText({ isError: mutation.isError === true, error: mutation.error }, failureText)
}

/**
 * El pie de los formularios que guardan: el error del envío, si lo hubo, y los
 * botones «Cancelar» y de la acción, con la etiqueta que cambia mientras se
 * envía. Es el único lugar donde se escribe esa estructura: los formularios de
 * cuentas, inventario, carta, roles, cobro y las ventanas de una sola acción lo usan.
 */
export function FormFooter({ mutation, failureText, onCancel, cancelLabel = 'Cancelar', submit, spansColumns = false }: FormFooterProps) {
  const wrap = spansColumns ? 'sm:col-span-2' : undefined
  const failure = failureOf(mutation, failureText)
  return (
    <>
      {failure === null ? null : (
        <div className={wrap}>
          <FormMessage tone="error">{failure}</FormMessage>
        </div>
      )}
      <div className={wrap}>
        <DialogFormActions>
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {submit === undefined ? null : <FormSubmitButton submit={submit} isPending={mutation.isPending} />}
        </DialogFormActions>
      </div>
    </>
  )
}
