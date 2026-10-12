import { Icon } from '@/components/Icon'
import { Badge } from '@/components/ui/badge'

/**
 * El aviso de que un pedido tiene una alergia en alguna nota, para el
 * encabezado de la tarjeta o del detalle. Va escrito, no solo en rojo.
 */
export function AllergyAlert() {
  return (
    <Badge variant="destructive" className="shrink-0 font-bold ring-1 ring-destructive/40">
      <Icon name="allergic" size={14} />
      Con alergia
    </Badge>
  )
}
