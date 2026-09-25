import AllergyBadge from '../../components/AllergyBadge'
import Icon from '../../components/Icon'
import type { OrderNoteFlag } from '../../hooks/useOrderNoteFlags'

interface ItemNoteProps {
  readonly note: string
  /**
   * Cómo leyó la nota la clasificación (`flagFor` de `useOrderNoteFlags`).
   * Si menciona una alergia, la nota pasa a rojo y lleva el distintivo.
   */
  readonly flag?: OrderNoteFlag
  /** Texto antes de la nota: "Nota del pedido". Sin él, la nota es de un plato. */
  readonly label?: string
}

/**
 * La nota de un plato o del pedido, resaltada.
 *
 * "Sin cebolla" perdido entre los nombres de los platos es un plato devuelto,
 * o algo peor si es una alergia. Va con fondo, icono y texto en negrita para
 * que la cocina la vea de un vistazo; si es una alergia, además con la
 * palabra "Alergia", no solo en rojo.
 */
export default function ItemNote({ note, flag, label }: ItemNoteProps) {
  if (note === '') {
    return null
  }
  const allergy = flag?.mentions_allergy === true
  const tone = allergy
    ? 'bg-destructive/10 text-destructive ring-destructive/30'
    : 'bg-warning/10 text-warning ring-warning/30'

  return (
    <p className={`m-0 mt-1 flex flex-wrap items-start gap-1.5 rounded-md px-2 py-1 text-sm font-semibold ring-1 ${tone}`}>
      {allergy ? <AllergyBadge flag={flag} withNote={false} /> : <Icon name="nota" size={16} className="mt-0.5 shrink-0" />}
      <span className="min-w-0 flex-1 break-words">
        {label === undefined ? <span className="sr-only">Nota: </span> : <span className="text-foreground">{label}: </span>}
        {note}
      </span>
    </p>
  )
}
