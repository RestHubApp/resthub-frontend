// Las preferencias de apariencia de una cuenta: tema, letra, tamaño del texto y
// orden del menú. Es lo que se guarda en este dispositivo (`appearanceStorage`)
// y lo que se aplica a la página (`applyAppearance`).
//
// Nada de esto es un dato del restaurante ni de la cuenta: son gustos de quien
// usa el aparato. Por eso no viaja al servidor y lo leído se valida siempre: lo que
// esté guardado puede venir de una versión vieja, de otra persona que tocó el
// almacenamiento o estar a medias, y cualquier cosa rara vuelve a su valor por
// omisión en vez de romper la pantalla.

/** Cuántas entradas caben en la barra inferior del celular (el resto va en «Más»). */
export const BOTTOM_BAR_SLOTS = 4

/** La versión de lo guardado: si cambia la forma, lo viejo se descarta. */
export const APPEARANCE_VERSION = 1

/**
 * Los temas. El `id` es el de `[data-theme]` en `index.css`, donde está la
 * paleta de cada uno y la prueba de contraste. `scheme` es el `color-scheme`
 * del tema.
 */
export const THEMES = [
  { id: 'terracotta', label: 'Terracota', description: 'Cálido y claro. El de siempre.', scheme: 'light' },
  { id: 'night', label: 'Noche', description: 'Fondo oscuro, para ambientes con poca luz.', scheme: 'dark' },
  { id: 'contrast', label: 'Alto contraste', description: 'Blanco y negro firmes, para leer sin esfuerzo.', scheme: 'light' },
  { id: 'olive', label: 'Oliva', description: 'Verde oliva sobre crema, tranquilo para la vista.', scheme: 'light' },
  { id: 'slate', label: 'Pizarra', description: 'Azul grisáceo, sobrio y fresco.', scheme: 'light' },
  { id: 'wine', label: 'Vino', description: 'Burdeos sobre blanco rosado, elegante.', scheme: 'light' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

/** «Según el sistema» sigue el modo claro u oscuro del aparato. */
export const SYSTEM_THEME = 'system'
export type ThemeChoice = ThemeId | typeof SYSTEM_THEME

/** El tema claro y el oscuro que elige «Según el sistema». */
export const SYSTEM_LIGHT_THEME: ThemeId = 'terracotta'
export const SYSTEM_DARK_THEME: ThemeId = 'night'

/** Las letras. El `id` es el de `[data-font]` en `index.css`. */
export const FONTS = [
  { id: 'geist', label: 'Geist', description: 'Moderna y limpia. La de siempre.' },
  { id: 'atkinson', label: 'Atkinson', description: 'Hecha para que no se confundan letras parecidas.' },
  { id: 'lexend', label: 'Lexend', description: 'Letras más separadas: cansa menos al leer.' },
] as const

type FontId = (typeof FONTS)[number]['id']

/** Los tamaños de texto. El `id` es el de `[data-text-size]` en `index.css`. */
export const TEXT_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Grande' },
  { id: 'larger', label: 'Muy grande' },
] as const

type TextSizeId = (typeof TEXT_SIZES)[number]['id']

/**
 * El orden del menú y la barra de abajo, por ruta de cada pantalla.
 *
 * Son rutas y no pantallas: la lista de lo que la cuenta puede ver sale de sus
 * permisos y manda siempre. Lo guardado aquí solo ordena; lo que ya no se
 * puede ver se ignora y lo nuevo se agrega al final.
 */
export interface MenuPreference {
  /** Las rutas en el orden elegido. Vacío: el orden de fábrica. */
  readonly order: readonly string[]
  /** Las rutas de la barra inferior. `null`: las primeras cuatro del orden. */
  readonly bottom: readonly string[] | null
}

export interface Appearance {
  readonly theme: ThemeChoice
  readonly font: FontId
  readonly textSize: TextSizeId
  readonly menu: MenuPreference
}

export const DEFAULT_MENU: MenuPreference = { order: [], bottom: null }

export const DEFAULT_APPEARANCE: Appearance = {
  theme: 'terracotta',
  font: 'geist',
  textSize: 'normal',
  menu: DEFAULT_MENU,
}

/** El tema que se pinta: «Según el sistema» se resuelve con el modo del aparato. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ThemeId {
  if (choice === SYSTEM_THEME) {
    return prefersDark ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME
  }
  return choice
}

// Tope de lo que se acepta de una lista guardada: bastante más de las pantallas
// que existen, para que un valor desmedido no llegue a la interfaz.
const MAX_PATHS = 100
const MAX_PATH_LENGTH = 120

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pick<T extends string>(options: readonly { readonly id: T }[], value: unknown, fallback: T): T {
  return options.find((option) => option.id === value)?.id ?? fallback
}

/** Una lista de rutas sin repetidas ni raras; `null` si lo guardado no es una lista. */
function pathsOf(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const valid = value.filter(
    (item): item is string => typeof item === 'string' && item.startsWith('/') && item.length <= MAX_PATH_LENGTH,
  )
  return [...new Set(valid)].slice(0, MAX_PATHS)
}

function menuOf(value: unknown): MenuPreference {
  if (!isRecord(value)) {
    return DEFAULT_MENU
  }
  const bottom = pathsOf(value['bottom'])
  return {
    order: pathsOf(value['order']) ?? [],
    bottom: bottom === null ? null : bottom.slice(0, BOTTOM_BAR_SLOTS),
  }
}

/**
 * Lo guardado, leído con desconfianza: cada preferencia inválida vuelve a su
 * valor por omisión sin tirar las demás, y una versión que no es la actual, un
 * JSON roto o algo que no es un objeto dan las preferencias de fábrica.
 */
export function parseAppearance(raw: string | null): Appearance {
  if (raw === null) {
    return DEFAULT_APPEARANCE
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return DEFAULT_APPEARANCE
  }
  if (!isRecord(parsed) || parsed['version'] !== APPEARANCE_VERSION) {
    return DEFAULT_APPEARANCE
  }
  return {
    theme: pick([...THEMES, { id: SYSTEM_THEME }], parsed['theme'], DEFAULT_APPEARANCE.theme),
    font: pick(FONTS, parsed['font'], DEFAULT_APPEARANCE.font),
    textSize: pick(TEXT_SIZES, parsed['textSize'], DEFAULT_APPEARANCE.textSize),
    menu: menuOf(parsed['menu']),
  }
}

/** Lo que se escribe en el almacenamiento. */
export function serializeAppearance(appearance: Appearance): string {
  return JSON.stringify({ version: APPEARANCE_VERSION, ...appearance })
}
