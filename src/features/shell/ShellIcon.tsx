import {
  Accessibility,
  Armchair,
  BookUser,
  Boxes,
  CalendarClock,
  ChartColumnIncreasing,
  ChefHat,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardList,
  CookingPot,
  Ellipsis,
  Eye,
  type LucideIcon,
  LogOut,
  ScrollText,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

/**
 * Los iconos del armazón: la barra de navegación, "Más", la sesión, la franja
 * de vista previa y las notificaciones. Se dibujan siempre, sin sesión o con
 * cualquier rol, así que van en su propio registro chico en vez del de
 * `icons.ts` (unas 90 entradas: precio, receta de inventario, indicadores del
 * panel BI...). El armazón es lo primero que baja el celular; con el registro
 * completo cargaba unos 90 iconos para dibujar 22.
 *
 * Cualquier otro icono de la aplicación sigue saliendo de `Icon` en
 * `components/icons.ts`, que es donde se agrega uno nuevo.
 */
const SHELL_ICONS = {
  pedido: ClipboardList,
  tablero: ChefHat,
  cocina: CookingPot,
  reservas: CalendarClock,
  clientes: BookUser,
  caja: Wallet,
  receta: ScrollText,
  carta: UtensilsCrossed,
  mesa: Armchair,
  inventario: Boxes,
  personal: UsersRound,
  roles: ShieldCheck,
  indicadores: ChartColumnIncreasing,
  mas: Ellipsis,
  perfil: UserRound,
  accesibilidad: Accessibility,
  salir: LogOut,
  ver: Eye,
  restaurante: Store,
  correcto: CircleCheck,
  alerta: CircleAlert,
  cancelar: CircleX,
} as const satisfies Record<string, LucideIcon>

export type ShellIconName = keyof typeof SHELL_ICONS

interface ShellIconProps {
  readonly name: ShellIconName
  /** Lado del cuadrado, en pixeles. Hereda el color del texto que lo rodea. */
  readonly size?: number
  /** Igual que en `Icon`: sin texto, el icono queda oculto al lector de pantalla. */
  readonly label?: string
  readonly className?: string
}

const DEFAULT_SIZE = 20
const STROKE_WIDTH = 1.75

/** La misma pinta que `Icon`, para el puñado de iconos que dibuja el armazón. */
export default function ShellIcon({ name, size = DEFAULT_SIZE, label, className }: ShellIconProps) {
  const Glyph = SHELL_ICONS[name]

  return (
    <Glyph
      className={className}
      size={size}
      strokeWidth={STROKE_WIDTH}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    />
  )
}
