import { Badge, type BadgeVariant } from './ui/badge'

export type StatusTone = 'pending' | 'confirmed' | 'completed' | 'cancelled'

// Cada tono es una variante de `Badge`. El estado siempre esta escrito: el color acompana.
const TONE_VARIANTS: Record<StatusTone, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'destructive',
}

interface StatusBadgeProps {
  readonly label: string
  /** Sin tono, la etiqueta es neutra. */
  readonly tone?: StatusTone | undefined
  /** Para dejar que una etiqueta larga baje de línea en vez de salirse de su tarjeta. */
  readonly className?: string | undefined
}

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <Badge variant={tone === undefined ? 'outline' : TONE_VARIANTS[tone]} className={className}>
      {label}
    </Badge>
  )
}
