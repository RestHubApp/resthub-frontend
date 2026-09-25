import type { OrderNoteFlag } from '../hooks/useOrderNoteFlags'
import Icon from './Icon'

interface AllergyBadgeProps {
  /** Lo que devuelve `flagFor(pedido, ítem)` de `useOrderNoteFlags`. */
  readonly flag: OrderNoteFlag | undefined
  readonly className?: string
}

const PERCENT = 100

function tooltip(flag: OrderNoteFlag): string {
  const confianza =
    flag.allergy_probability === null ? '' : ` (probabilidad ${String(Math.round(flag.allergy_probability * PERCENT))} %)`
  const motor = flag.engine === 'jev' ? 'la IA' : 'las reglas'
  return `Según ${motor}, la nota «${flag.note}» menciona una alergia o restricción${confianza}. Confírmalo con el cliente.`
}

/**
 * El distintivo rojo de alergia junto a la nota de un plato o de un pedido.
 *
 * Solo aparece cuando la clasificación dice que la nota menciona una alergia
 * o restricción; si la nota sigue pendiente o es una preferencia, no dibuja
 * nada. Lleva ícono y la palabra "Alergia": el rojo nunca va solo.
 */
export default function AllergyBadge({ flag, className }: AllergyBadgeProps) {
  if (flag?.mentions_allergy !== true) {
    return null
  }
  return (
    <span
      title={tooltip(flag)}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white dark:text-background ${className ?? ''}`}
    >
      <Icon name="alergico" size={14} />
      Alergia
      <span className="sr-only">{`: ${flag.note}`}</span>
    </span>
  )
}
