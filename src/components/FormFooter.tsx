import { DialogFormActions } from './DialogFormActions'
import { ErrorMessage } from './ErrorMessage'
import { FormSubmitButton, type FooterSubmit } from './FormSubmitButton'
import { Button } from './ui/button'

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

/**
 * El pie de los formularios que guardan: el error del envío, si lo hubo, y los
 * botones «Cancelar» y de la acción, con la etiqueta que cambia mientras se
 * envía. Es el único lugar donde se escribe esa estructura: los formularios de
 * cuentas, inventario, carta, roles, cobro y las ventanas de una sola acción lo usan.
 */
export function FormFooter({ mutation, failureText, onCancel, cancelLabel = 'Cancelar', submit, spansColumns = false }: FormFooterProps) {
  const wrap = spansColumns ? 'sm:col-span-2' : undefined
  const hasFailure = failureText !== undefined && mutation.isError === true
  return (
    <>
      {!hasFailure ? null : (
        <div className={wrap}>
          <ErrorMessage error={mutation.error} fallback={failureText} />
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
