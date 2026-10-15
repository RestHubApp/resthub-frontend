import { Glyph } from '@/components/Glyph'
import {
  Activity,
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
  History,
  type LucideIcon,
  LogOut,
  Maximize,
  Minimize,
  Palette,
  PersonStanding,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Wifi,
  WifiOff,
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
  order: ClipboardList,
  board: ChefHat,
  kitchen: CookingPot,
  reservations: CalendarClock,
  customers: BookUser,
  cashRegister: Wallet,
  recipe: ScrollText,
  menu: UtensilsCrossed,
  table: Armchair,
  inventory: Boxes,
  staff: UsersRound,
  roles: ShieldCheck,
  indicators: ChartColumnIncreasing,
  more: Ellipsis,
  profile: UserRound,
  accessibility: PersonStanding,
  search: Search,
  appearance: Palette,
  fullscreen: Maximize,
  exitFullscreen: Minimize,
  online: Wifi,
  offline: WifiOff,
  retry: RefreshCw,
  signOut: LogOut,
  view: Eye,
  history: History,
  observability: Activity,
  restaurant: Store,
  correct: CircleCheck,
  alert: CircleAlert,
  cancel: CircleX,
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

/** La misma pinta que `Icon`, para el puñado de iconos que dibuja el armazón. */
export function ShellIcon({ name, size = DEFAULT_SIZE, label, className }: ShellIconProps) {
  return <Glyph glyph={SHELL_ICONS[name]} size={size} label={label} className={className} />
}
