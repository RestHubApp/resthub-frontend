import type { ComponentType, SVGAttributes } from 'react'

/**
 * Un icono del registro (`icons.order`, de `components/icons.ts`). Se tipa a
 * mano lo que acepta un icono de Lucide para que ningún archivo fuera del
 * registro importe la biblioteca.
 */
export type IconGlyph = ComponentType<SVGAttributes<SVGSVGElement> & { size?: number; strokeWidth?: number }>

interface IconProps {
  /** El icono, nombrado desde el registro: `glyph={icons.order}`. */
  readonly glyph: IconGlyph
  /** Lado del cuadrado, en pixeles. Hereda el color del texto que lo rodea. */
  readonly size?: number
  /**
   * Texto para quien no ve el icono. Sin el, el icono queda oculto a los
   * lectores de pantalla, que es lo correcto cuando acompana a una etiqueta
   * que ya dice lo mismo.
   */
  readonly label?: string
  readonly className?: string | undefined
}

const DEFAULT_SIZE = 20
const STROKE_WIDTH = 1.75

/**
 * Dibuja un icono con el trazo y la accesibilidad de cada pantalla, también
 * los del armazón.
 *
 * El icono sale del registro de `icons.ts`, asi que cambiarlo es editar una
 * linea alli y verlo propagado por cada pantalla. Cada archivo nombra el suyo
 * (`icons.order`): pedir uno inexistente no compila y el empaquetador deja en
 * cada archivo solo los que nombra.
 */
export function Icon({ glyph: Glyph, size = DEFAULT_SIZE, label, className }: IconProps) {
  const isNamed = label !== undefined && label !== ''

  return (
    <Glyph
      className={className}
      size={size}
      strokeWidth={STROKE_WIDTH}
      role={isNamed ? 'img' : undefined}
      aria-label={label}
      aria-hidden={isNamed ? undefined : true}
      focusable="false"
    />
  )
}
