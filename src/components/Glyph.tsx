import type { ComponentType, SVGAttributes } from 'react'

// Lo que un icono de Lucide acepta: se tipa a mano para que ningún archivo fuera
// del registro importe la biblioteca.
type GlyphComponent = ComponentType<SVGAttributes<SVGSVGElement> & { size?: number; strokeWidth?: number }>

interface GlyphProps {
  readonly glyph: GlyphComponent
  /** Lado del cuadrado, en pixeles. Hereda el color del texto que lo rodea. */
  readonly size: number
  /**
   * Texto para quien no ve el icono. Sin el, el icono queda oculto a los
   * lectores de pantalla, que es lo correcto cuando acompana a una etiqueta
   * que ya dice lo mismo.
   */
  readonly label?: string | undefined
  readonly className?: string | undefined
}

const STROKE_WIDTH = 1.75

/**
 * Dibuja un icono con el trazo y la accesibilidad de cada pantalla. `Icon`
 * y `ShellIcon` solo ponen el registro del que sale cada uno.
 */
export function Glyph({ glyph: Lucide, size, label, className }: GlyphProps) {
  const isNamed = label !== undefined && label !== ''

  return (
    <Lucide
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
