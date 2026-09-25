import type { RestockAction } from '../../api/types'
import type { IconName } from '../../components/icons'

export type StatusTone = 'critical' | 'warning' | 'good' | 'neutral'

// Los colores de estado son reservados: comprar hoy es crítico, esta semana
// es aviso y esperar está bien. "Revisar merma" no es más o menos grave, es
// otra cosa que mirar: va en neutro, con su propio ícono.
export const ACTION_STYLES: Record<RestockAction, { readonly tone: StatusTone; readonly icon: IconName }> = {
  buy_today: { tone: 'critical', icon: 'critico' },
  buy_this_week: { tone: 'warning', icon: 'fecha' },
  wait: { tone: 'good', icon: 'correcto' },
  review_waste: { tone: 'neutral', icon: 'revisar' },
}

export const ACTION_ORDER: readonly RestockAction[] = ['buy_today', 'buy_this_week', 'review_waste', 'wait']

export const ACTION_LABELS: Record<RestockAction, string> = {
  buy_today: 'Comprar hoy',
  buy_this_week: 'Comprar esta semana',
  wait: 'Esperar',
  review_waste: 'Revisar merma',
}

export const TONE_BADGE: Record<StatusTone, string> = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  good: 'bg-success/10 text-success',
  neutral: 'bg-muted text-foreground',
}
