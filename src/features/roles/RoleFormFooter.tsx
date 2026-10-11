import { DialogFormActions } from '@/components/DialogFormActions'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'

interface RoleFormFooterProps {
  readonly readOnly: boolean
  readonly isError: boolean
  readonly error: unknown
  readonly isPending: boolean
  readonly failureText: string
  readonly onDone: () => void
}

/** El error del envío y los botones del formulario de rol; solo lectura, únicamente «Cerrar». */
export function RoleFormFooter({ readOnly, isError, error, isPending, failureText, onDone }: RoleFormFooterProps) {
  return (
    <>
      {isError ? <FormMessage tone="error">{errorMessage(error, failureText)}</FormMessage> : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onDone}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {readOnly ? null : (
          <Button type="submit" size="lg" className="h-11 px-4" disabled={isPending}>
            <Icon name="confirm" size={16} />
            <span>{isPending ? 'Guardando…' : 'Guardar'}</span>
          </Button>
        )}
      </DialogFormActions>
    </>
  )
}
