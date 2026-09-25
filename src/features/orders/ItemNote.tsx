import Icon from '../../components/Icon'

interface ItemNoteProps {
  readonly note: string
  /**
   * La nota menciona una alergia o restriccion. Hoy nadie lo marca; lo hara la
   * clasificacion de notas con IA, y el tablero ya tiene donde mostrarlo.
   */
  readonly allergy?: boolean
}

/**
 * La nota de un plato, resaltada.
 *
 * "Sin cebolla" perdido entre los nombres de los platos es un plato devuelto,
 * o algo peor si es una alergia. Va con fondo, icono y texto en negrita para
 * que la cocina la vea de un vistazo.
 */
export default function ItemNote({ note, allergy = false }: ItemNoteProps) {
  if (note === '') {
    return null
  }
  const tone = allergy
    ? 'bg-destructive/10 text-destructive ring-destructive/30'
    : 'bg-warning/10 text-warning ring-warning/30'

  return (
    <p className={`m-0 mt-1 flex items-start gap-1.5 rounded-md px-2 py-1 text-sm font-semibold ring-1 ${tone}`}>
      <Icon name={allergy ? 'alergia' : 'nota'} size={16} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">
        {allergy ? <span className="mr-1 uppercase">Alergia:</span> : <span className="sr-only">Nota: </span>}
        {note}
      </span>
    </p>
  )
}
