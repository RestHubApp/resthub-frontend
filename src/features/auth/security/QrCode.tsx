import { encode } from 'uqr'

/** El dibujo del código: un cuadro por módulo oscuro, en un solo trazo. */
function pathOf(data: readonly (readonly boolean[])[]): string {
  return data
    .flatMap((row, y) => row.map((isDark, x) => (isDark ? `M${String(x)} ${String(y)}h1v1h-1z` : '')))
    .join('')
}

/**
 * Un código QR en SVG. Va negro sobre blanco también en el tema oscuro: las
 * aplicaciones de verificación no siempre leen un código invertido.
 */
export function QrCode({ value, label }: { readonly value: string; readonly label: string }) {
  const { data, size } = encode(value, { ecc: 'M', border: 2 })
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      shapeRendering="crispEdges"
      className="size-48 rounded-md bg-white text-black"
    >
      <path d={pathOf(data)} fill="currentColor" />
    </svg>
  )
}
