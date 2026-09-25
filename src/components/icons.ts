// Registro de iconos. Unica fuente de verdad de toda la interfaz.
//
// Cada nombre del dominio apunta a un icono de Lucide, la biblioteca que trae
// shadcn/ui. Cambiar el icono de "pedido" por otro es editar una linea de este
// archivo y verlo en todas las pantallas, sin tocar ni un componente: el resto
// de la aplicacion no importa Lucide, pide un nombre a `Icon.tsx`.
//
// Todos comparten el mismo trazo y se dibujan con el color del texto que los
// rodea, para que hereden el tono de donde se usen.

import {
  AlignLeft,
  Armchair,
  Banknote,
  Boxes,
  Calendar,
  ChartColumnIncreasing,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleX,
  ClipboardList,
  Clock,
  Ellipsis,
  Eye,
  EyeOff,
  Hash,
  Hourglass,
  House,
  KeyRound,
  LockKeyhole,
  LogIn,
  LogOut,
  type LucideIcon,
  Mail,
  Menu,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Store,
  UserCog,
  UserRound,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react'

export const ICONS = {
  // Navegacion y dominio.
  inicio: House,
  menu: Menu,
  mas: Ellipsis,
  restaurante: Store,
  pedido: ClipboardList,
  tablero: ChefHat,
  carta: UtensilsCrossed,
  mesa: Armchair,
  inventario: Boxes,
  personal: UsersRound,
  indicadores: ChartColumnIncreasing,
  perfil: UserRound,
  pago: Banknote,
  horario: Clock,
  pronto: Hourglass,

  // Acciones.
  agregar: Plus,
  editar: Pencil,
  confirmar: Check,
  cancelar: CircleX,
  salir: LogOut,
  entrar: LogIn,
  ver: Eye,
  ocultar: EyeOff,
  buscar: Search,
  anterior: ChevronLeft,
  siguiente: ChevronRight,
  desplegar: ChevronsUpDown,
  llave: KeyRound,
  encender: Power,

  // Estado.
  alerta: CircleAlert,

  // Campos de formulario: acompañan a la etiqueta, no la reemplazan.
  correo: Mail,
  telefono: Phone,
  fecha: Calendar,
  candado: LockKeyhole,
  numero: Hash,
  descripcion: AlignLeft,
  tipoDeCuenta: UserCog,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
