import { Icon, type IconGlyph } from './Icon'

interface FormMessageProps {
  readonly tone: 'error' | 'ok' | 'warning' | 'info'
  readonly children: React.ReactNode
  /**
   * Un error de respaldo (el del armazón o el general de una ventana), que
   * se calla si la pantalla o la ventana ya muestran el suyo. Ver
   * `ApiFailureNotice` y `FormDialog`.
   */
  readonly fallback?: boolean
  /** Un icono antes del texto, para los avisos que lo llevan. */
  readonly icon?: IconGlyph
  /** Cómo se anuncia. Por omisión, un error interrumpe (`alert`) y el resto espera turno (`status`). */
  readonly role?: 'alert' | 'status'
  /** Una acción al lado del texto (p. ej. «Reintentar»). */
  readonly action?: React.ReactNode
}

// Cada tono es texto oscuro sobre el tinte del mismo color, con contraste AA
// (ver `index.css`).
const TONE_CLASSES = {
  error: 'bg-destructive/10 text-destructive',
  ok: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-secondary text-secondary-foreground',
} as const

// Una falla se avisa una sola vez: los avisos de respaldo buscan esta marca
// para no repetir lo que la pantalla ya dice.
function failureMark(tone: FormMessageProps['tone'], isFallback: boolean): { readonly 'data-falla'?: string } {
  if (tone !== 'error') {
    return {}
  }
  return { 'data-falla': isFallback ? 'respaldo' : 'propia' }
}

/**
 * Un aviso junto a lo que lo causó: el resultado de enviar un formulario o una
 * nota sobre el estado de la pantalla.
 *
 * Aparece despues de que la persona actuo, lejos de donde mira, asi que se
 * anuncia: un error interrumpe al lector de pantalla y lo demas espera turno.
 */
export function FormMessage({ tone, children, fallback = false, icon, role, action }: FormMessageProps) {
  const layout = icon === undefined ? '' : ' flex flex-wrap items-start gap-2'
  return (
    <p
      {...failureMark(tone, fallback)}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={`m-0 rounded-lg px-3 py-2 text-sm ${TONE_CLASSES[tone]}${layout}`}
    >
      {icon === undefined ? null : <Icon glyph={icon} size={18} className="mt-0.5 shrink-0" />}
      {icon === undefined ? children : <span className="min-w-0 flex-1">{children}</span>}
      {action}
    </p>
  )
}
