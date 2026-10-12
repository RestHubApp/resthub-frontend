import { Glyph } from './Glyph'
import { ICONS, type IconName } from './icons'

interface IconProps {
  readonly name: IconName
  /** Lado del cuadrado, en pixeles. Hereda el color del texto que lo rodea. */
  readonly size?: number
  /** Texto para quien no ve el icono; sin el, queda oculto a los lectores de pantalla. */
  readonly label?: string
  readonly className?: string | undefined
}

const DEFAULT_SIZE = 20

/**
 * El componente que dibuja los iconos de las pantallas. El armazón tiene el
 * suyo, `ShellIcon`, con un registro aparte para que su carga sea la mínima;
 * ambos dibujan con `Glyph`.
 *
 * El icono sale del registro de `icons.ts`, asi que cambiarlo es editar una
 * linea alli y verlo propagado por cada pantalla. `IconName` viene del mismo
 * registro, de modo que pedir un icono inexistente no compila.
 */
export function Icon({ name, size = DEFAULT_SIZE, label, className }: IconProps) {
  return <Glyph glyph={ICONS[name]} size={size} label={label} className={className} />
}
