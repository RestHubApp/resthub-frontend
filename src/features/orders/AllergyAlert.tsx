import Icon from '../../components/Icon'

/**
 * El aviso de que un pedido tiene una alergia en alguna nota, para el
 * encabezado de la tarjeta o del detalle. Va escrito, no solo en rojo.
 */
export default function AllergyAlert() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive ring-1 ring-destructive/40">
      <Icon name="alergico" size={14} />
      Con alergia
    </span>
  )
}
