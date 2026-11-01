import { Icon, type IconGlyph } from './Icon'
import { Button } from './ui/button'

/** La acción principal de un pie de formulario. */
export interface FooterSubmit {
  readonly label: string
  /** La etiqueta mientras se envía; por omisión, «Guardando…». */
  readonly pendingLabel?: string
  readonly icon?: IconGlyph
  readonly variant?: 'default' | 'destructive'
  /** Para una acción que no envía el formulario (`type="submit"`) sino que llama a esto. */
  readonly onClick?: () => void
  /** Bloquea la acción aunque no esté enviando (el formulario aún no está completo). */
  readonly isDisabled?: boolean
}

interface FormSubmitButtonProps {
  readonly submit: FooterSubmit
  readonly isPending: boolean
}

/** El botón de la acción: envía el formulario, o llama a `onClick` si la acción no lo envía. */
export function FormSubmitButton({ submit, isPending }: FormSubmitButtonProps) {
  return (
    <Button
      type={submit.onClick === undefined ? 'submit' : 'button'}
      variant={submit.variant ?? 'default'}
      disabled={isPending || submit.isDisabled === true}
      onClick={submit.onClick}
    >
      {submit.icon === undefined ? null : <Icon glyph={submit.icon} size={16} />}
      <span>{isPending ? (submit.pendingLabel ?? 'Guardando…') : submit.label}</span>
    </Button>
  )
}
