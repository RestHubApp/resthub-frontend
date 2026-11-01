// Registro de iconos. Única fuente de verdad de toda la interfaz.
//
// Cada nombre del dominio apunta a un icono de Lucide, la biblioteca que trae
// shadcn/ui. Cambiar el icono de "pedido" por otro es editar una línea de este
// archivo y verlo en todas las pantallas, sin tocar ni un componente: el resto
// de la aplicación no importa Lucide, nombra el icono del registro:
//
//   import * as icons from '@/components/icons'
//   <Icon glyph={icons.order} />
//
// Son exports con nombre y no un objeto para que el empaquetador deje en cada
// archivo solo los iconos que ese archivo nombra. Con un objeto, el centenar de
// iconos viajaba en el archivo inicial y cada primera visita lo pagaba aunque la
// pantalla dibujara cinco. Por lo mismo, `icons` no se recorre ni se indexa con
// una variable (`icons[name]`): eso vuelve a traerlos todos. Lo que elige un
// icono según un dato guarda el icono mismo (`icons.send`), no su nombre.
//
// Todos comparten el mismo trazo y se dibujan con el color del texto que los
// rodea, para que hereden el tono de donde se usen.

export {
  // Navegación y dominio.
  Ellipsis as more,
  Store as restaurant,
  ClipboardList as order,
  ChefHat as board,
  UtensilsCrossed as dishMenu,
  Armchair as table,
  Boxes as inventory,
  UsersRound as staff,
  ShieldCheck as roles,
  ChartColumnIncreasing as indicators,
  UserRound as profile,
  PersonStanding as accessibility,
  Sun as lightMode,
  Moon as darkMode,
  Monitor as deviceMode,
  GripVertical as dragHandle,
  Banknote as payment,
  Clock as schedule,
  Hourglass as soon,

  // Acciones.
  Plus as add,
  Pencil as edit,
  Check as confirm,
  CircleX as cancel,
  LogOut as signOut,
  LogIn as signIn,
  Eye as view,
  EyeOff as hide,
  Search as search,
  ALargeSmall as textSize,
  Palette as appearance,
  Maximize as fullscreen,
  Minimize as exitFullscreen,
  ChevronLeft as previous,
  ChevronRight as next,
  KeyRound as key,
  Power as turnOn,
  SlidersHorizontal as settings,

  // Estado.
  CircleAlert as alert,

  // Pedidos, tablero y cobro.
  Minus as remove,
  Trash2 as delete,
  ShoppingBag as takeaway,
  Send as send,
  ConciergeBell as serve,
  CircleCheckBig as ready,
  StickyNote as note,
  History as history,
  ArrowUp as up,
  ArrowDown as down,
  Radio as live,
  Wifi as online,
  WifiOff as offline,
  RefreshCw as retry,
  Wallet as cashRegister,
  HandCoins as tip,
  BadgePercent as discount,
  Gift as courtesy,
  Printer as print,
  Download as download,
  Upload as upload,
  ImageOff as noPhoto,
  CookingPot as kitchen,
  Bike as delivery,
  BookUser as customers,
  CalendarClock as reservations,
  MapPin as location,
  // Menú e inventario.
  Tag as price,
  Coins as cost,
  ShoppingCart as purchase,
  PackageMinus as waste,
  ClipboardCheck as count,
  ScrollText as recipe,
  ArrowLeftRight as movements,
  TriangleAlert as notice,

  // Panel BI e IA.
  ShieldAlert as allergic,
  RotateCw as update,
  TrendingUp as trendRises,
  TrendingDown as trendFalls,
  MoveRight as trendStable,
  ArrowUpDown as sort,
  ArrowUpNarrowWide as orderAscending,
  ArrowDownWideNarrow as orderDescending,
  Sparkles as ai,
  ListChecks as rules,
  Table2 as grid,
  ChartLine as chart,
  ShoppingBasket as buy,
  OctagonAlert as critical,
  ScanSearch as review,
  CircleCheck as correct,
  ChevronDown as expand,

  // Observabilidad del sistema.
  Activity as observability,
  Pause as pause,
  Play as resume,

  // Campos de formulario: acompañan a la etiqueta, no la reemplazan.
  Mail as email,
  Phone as phone,
  Calendar as date,
  LockKeyhole as lock,
  Hash as number,
  AlignLeft as description,
  UserCog as accountType,
} from 'lucide-react'
