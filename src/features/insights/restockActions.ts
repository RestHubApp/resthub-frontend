import type { RestockAction } from '@/api/types'
import type { IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import type { BadgeVariant } from '@/components/ui/badge'

// Los colores de estado son reservados: comprar hoy es crítico, esta semana
// es aviso y esperar está bien. "Revisar merma" no es más o menos grave, es
// otra cosa que mirar: va en neutro, con su propio ícono.
export const ACTION_STYLES: Record<RestockAction, { readonly variant: BadgeVariant; readonly icon: IconGlyph }> = {
  buy_today: { variant: 'destructive', icon: icons.critical },
  buy_this_week: { variant: 'warning', icon: icons.date },
  wait: { variant: 'success', icon: icons.correct },
  review_waste: { variant: 'muted', icon: icons.review },
}

export const ACTION_ORDER: readonly RestockAction[] = ['buy_today', 'buy_this_week', 'review_waste', 'wait']

export const ACTION_LABELS: Record<RestockAction, string> = {
  buy_today: 'Comprar hoy',
  buy_this_week: 'Comprar esta semana',
  wait: 'Esperar',
  review_waste: 'Revisar merma',
}
