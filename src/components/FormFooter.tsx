import { DialogFormActions } from './DialogFormActions'
import { FormMessage } from './FormMessage'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { Button } from './ui/button'
import { mutationErrorText } from '@/hooks/mutationErrorText'

/** Lo que el pie necesita saber de la mutación del formulario. */
interface FooterMutation {
  readonly isError: boolean
  readonly error: unknown
  readonly isPending: boolean
}

interface FormFooterProps {
  readonly mutation: FooterMutation
  /** El mensaje cuando el error no trae uno propio del servidor. */
  readonly failureText: string
  readonly onCancel: () => void
  readonly submit: {
    readonly label: string
    readonly pendingLabel: string
    readonly icon?: IconName
  }
  /** `lg` es la altura de las ventanas de dos columnas; `md`, la de los formularios en línea. */
  readonly size?: 'md' | 'lg'
  /** En una grilla de dos columnas, el pie ocupa las dos. */
  readonly spansColumns?: boolean
}

const HEIGHTS = { md: 'h-10 px-4', lg: 'h-11 px-4' } as const

/**
 * El pie de un formulario que guarda: el error del envío, si lo hubo, y los
 * botones "Cancelar" y de la acción, con la etiqueta que cambia mientras se
 * envía. Lo comparten los formularios de cuentas, de encargados, de clientes y
 * de reservas.
 */
export function FormFooter({ mutation, failureText, onCancel, submit, size = 'md', spansColumns = false }: FormFooterProps) {
  const wrap = spansColumns ? 'sm:col-span-2' : undefined
  const failure = mutationErrorText(mutation, failureText)
  return (
    <>
      {failure === null ? null : (
        <div className={wrap}>
          <FormMessage tone="error">{failure}</FormMessage>
        </div>
      )}
      <div className={wrap}>
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className={HEIGHTS[size]} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className={HEIGHTS[size]} disabled={mutation.isPending}>
            {submit.icon === undefined ? null : <Icon name={submit.icon} size={16} />}
            <span>{mutation.isPending ? submit.pendingLabel : submit.label}</span>
          </Button>
        </DialogFormActions>
      </div>
    </>
  )
}
