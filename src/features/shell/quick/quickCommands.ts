import type { AnyPermissionCode, Session } from '@/api/types'
import type { IconName } from '@/components/icons'
import { ACTION_PARAM, SCREEN_ACTIONS } from '@/hooks/screenActions'
import type { Appearance } from '@/services/appearanceRules'
import { paths } from '@/services/paths'
import type { NavEntry } from '@/features/shell/navigation'
import type { ShellIconName } from '@/features/shell/ShellIcon'
import { QUICK_SYNONYMS } from './quickSearch'

export type QuickGroup = 'go' | 'actions' | 'appearance' | 'account'

/** Lo que pasa al elegir una opción. Son datos: quien dibuja la paleta es quien los ejecuta. */
export type QuickEffect =
  | { readonly type: 'navigate'; readonly to: string }
  | { readonly type: 'mode'; readonly mode: Appearance['mode'] }
  | { readonly type: 'textSize'; readonly step: -1 | 1 }
  | { readonly type: 'contrast' }
  | { readonly type: 'signOut' }

export interface QuickCommand {
  readonly id: string
  readonly group: QuickGroup
  readonly label: string
  readonly description?: string
  /** Un icono del armazón (las pantallas) o del registro general (lo demás). */
  readonly icon: { readonly shell: ShellIconName } | { readonly general: IconName }
  /** Otras palabras con las que se busca, sin tildes. */
  readonly synonyms: readonly string[]
  /** Si es el ajuste que ya está puesto (el modo actual, el alto contraste activado). */
  readonly isActive?: boolean
  readonly effect: QuickEffect
}

export const QUICK_GROUP_LABELS: Readonly<Record<QuickGroup, string>> = {
  go: 'Ir a',
  actions: 'Acciones',
  appearance: 'Apariencia',
  account: 'Cuenta',
}

export const QUICK_GROUP_ORDER: readonly QuickGroup[] = ['go', 'actions', 'appearance', 'account']

export interface QuickContext {
  /** Las pantallas del menú de la cuenta, ya filtradas por permisos y en su orden (`useMenuLayout().ordered`). */
  readonly entries: readonly NavEntry[]
  readonly account: Session
  readonly isPreview: boolean
  readonly mode: Appearance['mode']
  readonly isHighContrast: boolean
  readonly canSmaller: boolean
  readonly canLarger: boolean
}

function goCommands({ entries }: QuickContext): readonly QuickCommand[] {
  return entries.map((entry) => ({
    id: `go:${entry.to}`,
    group: 'go',
    label: entry.label,
    description: entry.description,
    icon: { shell: entry.icon },
    synonyms: QUICK_SYNONYMS[entry.to] ?? [],
    effect: { type: 'navigate', to: entry.to },
  }))
}

/**
 * Las acciones de la lista cerrada (`SCREEN_ACTIONS`) que la cuenta puede hacer:
 * las que su permiso permite y cuya pantalla está en su menú. Solo navegan a
 * `<pantalla>?accion=<id>`; la pantalla abre el diálogo vacío y es ella (y el
 * servidor) quien vuelve a comprobarlo.
 */
function actionCommands({ entries, account }: QuickContext): readonly QuickCommand[] {
  const granted = new Set<AnyPermissionCode>(account.permissions)
  return SCREEN_ACTIONS.flatMap((action) => {
    const screen = entries.find((entry) => entry.to === action.screen)
    if (action.permission === undefined || !granted.has(action.permission) || screen === undefined) {
      return []
    }
    return [
      {
        id: `action:${action.id}`,
        group: 'actions',
        label: action.label,
        description: `En ${screen.label}`,
        icon: { general: 'add' },
        synonyms: QUICK_SYNONYMS[action.id] ?? [],
        effect: { type: 'navigate', to: `${action.screen}?${ACTION_PARAM}=${action.id}` },
      } satisfies QuickCommand,
    ]
  })
}

const MODE_OPTIONS: readonly { readonly id: Appearance['mode']; readonly label: string; readonly icon: IconName }[] = [
  { id: 'light', label: 'Modo claro', icon: 'lightMode' },
  { id: 'dark', label: 'Modo oscuro', icon: 'darkMode' },
  { id: 'system', label: 'Modo automático', icon: 'deviceMode' },
]

function modeCommands({ mode }: QuickContext): readonly QuickCommand[] {
  return MODE_OPTIONS.map((option) => ({
    id: `appearance:mode-${option.id}`,
    group: 'appearance',
    label: option.label,
    ...(option.id === 'system' ? { description: 'Como tu celular o computadora' } : {}),
    icon: { general: option.icon },
    synonyms: ['tema', 'color', 'fondo', 'noche', 'dia'],
    isActive: mode === option.id,
    effect: { type: 'mode', mode: option.id },
  }))
}

function textCommands({ canSmaller, canLarger }: QuickContext): readonly QuickCommand[] {
  const steps = [
    { isAvailable: canSmaller, id: 'text-smaller', label: 'Texto más pequeño', description: 'A−', step: -1, synonyms: ['letra', 'tamano', 'achicar', 'reducir'] },
    { isAvailable: canLarger, id: 'text-larger', label: 'Texto más grande', description: 'A+', step: 1, synonyms: ['letra', 'tamano', 'agrandar', 'aumentar'] },
  ] as const
  return steps
    .filter((option) => option.isAvailable)
    .map((option) => ({
      id: `appearance:${option.id}`,
      group: 'appearance',
      label: option.label,
      description: option.description,
      icon: { general: 'textSize' },
      synonyms: option.synonyms,
      effect: { type: 'textSize', step: option.step },
    }))
}

function appearanceCommands(context: QuickContext): readonly QuickCommand[] {
  return [
    ...modeCommands(context),
    ...textCommands(context),
    {
      id: 'appearance:contrast',
      group: 'appearance',
      label: context.isHighContrast ? 'Quitar el alto contraste' : 'Activar el alto contraste',
      icon: { general: 'accessibility' },
      synonyms: ['accesibilidad', 'vista', 'legible'],
      isActive: context.isHighContrast,
      effect: { type: 'contrast' },
    },
    {
      id: 'appearance:more',
      group: 'appearance',
      label: 'Más ajustes de apariencia',
      description: 'Color, letra, densidad y orden del menú',
      icon: { general: 'settings' },
      synonyms: ['personalizar', 'colores', 'menu', 'densidad'],
      effect: { type: 'navigate', to: paths.appearance },
    },
  ]
}

/**
 * La cuenta: el perfil siempre; la contraseña y la salida salvo donde la
 * sesión no las permite. La vista previa no tiene contraseña ni «Cerrar
 * sesión» (se sale desde su franja) y la administración del sistema no cambia
 * la suya desde acá, igual que en «Mi perfil».
 */
function accountCommands({ account, isPreview }: QuickContext): readonly QuickCommand[] {
  const commands: QuickCommand[] = [
    {
      id: 'account:profile',
      group: 'account',
      label: 'Mi perfil',
      description: 'Tus datos y tu cuenta',
      icon: { shell: 'profile' },
      synonyms: ['usuario', 'datos'],
      effect: { type: 'navigate', to: paths.profile },
    },
  ]
  if (!isPreview && account.kind !== 'platform') {
    commands.push({
      id: 'account:password',
      group: 'account',
      label: 'Cambiar contraseña',
      icon: { general: 'key' },
      synonyms: ['clave', 'seguridad'],
      effect: { type: 'navigate', to: `${paths.profile}?${ACTION_PARAM}=cambiar-contrasena` },
    })
  }
  if (!isPreview) {
    commands.push({
      id: 'account:sign-out',
      group: 'account',
      label: 'Cerrar sesión',
      icon: { shell: 'signOut' },
      synonyms: ['salir', 'terminar turno'],
      effect: { type: 'signOut' },
    })
  }
  return commands
}

/** Todas las opciones de la paleta para esta cuenta, agrupadas en el orden de `QUICK_GROUP_ORDER`. */
export function buildQuickCommands(context: QuickContext): readonly QuickCommand[] {
  return [...goCommands(context), ...actionCommands(context), ...appearanceCommands(context), ...accountCommands(context)]
}
