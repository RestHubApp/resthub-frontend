import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useQueuedOrders } from '../../store/offlineQueue'
import { useSession } from '../../store/session'
import { leavePreview } from './leavePreview'

// En la franja, blanco sobre su color; en una pantalla, el botón principal de siempre.
const ESTILOS = {
  banner: 'h-11 gap-2 bg-white px-3 text-warning hover:bg-white/90 focus-visible:ring-white/70',
  page: 'h-11 gap-2 px-4',
} as const

interface PreviewExitButtonProps {
  /** Dónde va: en la franja de arriba (por omisión) o en una pantalla. */
  readonly tone?: keyof typeof ESTILOS
}

/**
 * «Salir de la vista previa», en la franja de arriba o en una pantalla.
 *
 * Si quedaron pedidos sin enviar en el local de muestra, se avisa antes de
 * descartarlos: nada se pierde en silencio, ni siquiera en una prueba.
 */
export default function PreviewExitButton({ tone = 'banner' }: PreviewExitButtonProps) {
  const pendientes = useQueuedOrders(useSession((state) => state.account))

  const boton = (onClick?: () => void) => (
    <Button type="button" size={tone === 'page' ? 'lg' : 'default'} className={ESTILOS[tone]} onClick={onClick}>
      <Icon name="salir" size={18} />
      <span>Salir de la vista previa</span>
    </Button>
  )

  if (pendientes.length === 0) {
    return boton(leavePreview)
  }
  const cuantos = pendientes.length === 1 ? 'Un pedido del local de muestra espera' : `${String(pendientes.length)} pedidos del local de muestra esperan`
  return (
    <ConfirmDialog
      trigger={boton()}
      title="¿Salir con pedidos sin enviar?"
      description={`${cuantos} señal: ${pendientes.map((pedido) => pedido.label).join(', ')}. Al salir de la vista previa se descartan.`}
      confirmLabel="Salir y descartarlos"
      onConfirm={leavePreview}
    />
  )
}
