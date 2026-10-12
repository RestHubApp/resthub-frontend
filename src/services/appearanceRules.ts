// Las preferencias de apariencia de una cuenta: modo (claro, oscuro o automático),
// color de acento, alto contraste, letra, tamaño del texto, densidad y orden del
// menú. Es lo que se guarda en este celular o computadora (`appearanceStorage`) y
// lo que se aplica a la página (`applyAppearance`).
//
// Nada de esto es un dato del restaurante ni de la cuenta: son gustos de quien
// usa el dispositivo. Por eso no viaja al servidor y lo leído se valida siempre: lo que
// esté guardado puede venir de una versión vieja, de otra persona que tocó el
// almacenamiento o estar a medias, y cualquier cosa rara vuelve a su valor por
// omisión en vez de romper la pantalla.

/** Cuántas entradas caben en la barra inferior del celular (el resto va en «Más»). */
export const BOTTOM_BAR_SLOTS = 4

/** La versión de lo guardado. La 1 (un solo `theme`) se convierte al leerla; otra se descarta. */
const APPEARANCE_VERSION = 2
const LEGACY_VERSION = 1

/** El modo: `system` sigue el modo claro u oscuro del dispositivo. */
export const MODES = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Automático (como tu celular o computadora)' },
] as const

type ModeId = (typeof MODES)[number]['id']

/**
 * Los colores de acento. Cada uno tiene variante clara y oscura en `index.css`
 * (`[data-theme='olive']` y `[data-theme='olive-dark']`); «Alto contraste» es
 * aparte y no usa acento.
 */
export const ACCENTS = [
  { id: 'terracotta', label: 'Terracota', description: 'Cálido, el de siempre.' },
  { id: 'olive', label: 'Oliva', description: 'Verde oliva, tranquilo para la vista.' },
  { id: 'slate', label: 'Pizarra', description: 'Azul grisáceo, sobrio y fresco.' },
  { id: 'wine', label: 'Vino', description: 'Burdeos, elegante.' },
] as const

type AccentId = (typeof ACCENTS)[number]['id']

/** Alto contraste es un interruptor aparte: blanco y negro firmes, en claro o en oscuro. */
type ContrastId = 'normal' | 'high'

/**
 * Los temas que existen en `index.css` (`[data-theme]`): cada acento en claro y en
 * oscuro, y el alto contraste en claro y en oscuro. `scheme` es su `color-scheme`.
 * La prueba de contraste recorre esta lista.
 */
export const THEMES = [
  { id: 'terracotta', scheme: 'light' },
  { id: 'olive', scheme: 'light' },
  { id: 'slate', scheme: 'light' },
  { id: 'wine', scheme: 'light' },
  { id: 'contrast', scheme: 'light' },
  { id: 'terracotta-dark', scheme: 'dark' },
  { id: 'olive-dark', scheme: 'dark' },
  { id: 'slate-dark', scheme: 'dark' },
  { id: 'wine-dark', scheme: 'dark' },
  { id: 'contrast-dark', scheme: 'dark' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

/** Las letras. El `id` es el de `[data-font]` en `index.css`. */
export const FONTS = [
  { id: 'geist', label: 'Geist', description: 'Moderna y limpia. La de siempre.' },
  { id: 'atkinson', label: 'Atkinson', description: 'Hecha para que no se confundan letras parecidas.' },
  { id: 'lexend', label: 'Lexend', description: 'Letras más separadas: cansa menos al leer.' },
] as const

type FontId = (typeof FONTS)[number]['id']

/** Los tamaños de texto. El `id` es el de `[data-text-size]` en `index.css`; `percent` es lo que se muestra. */
export const TEXT_SIZES = [
  { id: 'normal', label: 'Normal', percent: '100 %' },
  { id: 'large', label: 'Grande', percent: '112,5 %' },
  { id: 'larger', label: 'Muy grande', percent: '125 %' },
  { id: 'largest', label: 'Enorme', percent: '150 %' },
] as const

type TextSizeId = (typeof TEXT_SIZES)[number]['id']

/**
 * La densidad de los controles. Solo cuenta con puntero fino (ratón o panel
 * táctil de laptop): con el dedo los controles miden siempre 44 px.
 */
export const DENSITIES = [
  { id: 'comfortable', label: 'Cómoda', description: 'Controles de 44 px, como siempre.' },
  { id: 'compact', label: 'Compacta', description: 'Controles y menú más bajos: cabe más en la pantalla.' },
] as const

type DensityId = (typeof DENSITIES)[number]['id']

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
  /** Las rutas de la barra inferior. `null`: la de fábrica, según lo que la cuenta puede abrir. */
  readonly bottom: readonly string[] | null
}

/** Lo que decide el color de la página: el modo, el acento y el alto contraste. */
export type ColorChoice = Pick<Appearance, 'mode' | 'accent' | 'contrast'>

export interface Appearance {
  readonly mode: ModeId
  readonly accent: AccentId
  readonly contrast: ContrastId
  readonly font: FontId
  readonly textSize: TextSizeId
  readonly density: DensityId
  readonly menu: MenuPreference
}

export const DEFAULT_MENU: MenuPreference = { order: [], bottom: null }

export const DEFAULT_APPEARANCE: Appearance = {
  mode: 'light',
  accent: 'terracotta',
  contrast: 'normal',
  font: 'geist',
  textSize: 'normal',
  density: 'comfortable',
  menu: DEFAULT_MENU,
}

/** Si el modo se pinta oscuro: el elegido, o el del dispositivo en «Automático». */
export function isDarkMode(mode: ModeId, prefersDark: boolean): boolean {
  return mode === 'system' ? prefersDark : mode === 'dark'
}

/**
 * El tema que se pinta (`data-theme`). El alto contraste manda sobre el acento;
 * el modo escoge entre la variante clara y la oscura.
 */
export function resolveTheme(appearance: ColorChoice, prefersDark: boolean): ThemeId {
  const isDark = isDarkMode(appearance.mode, prefersDark)
  const base = appearance.contrast === 'high' ? 'contrast' : appearance.accent
  return isDark ? (`${base}-dark` as const) : base
}

/** El tamaño de texto que queda tras subir (`1`) o bajar (`-1`) un paso; en los extremos, el mismo. */
export function stepTextSize(current: TextSizeId, step: -1 | 1): TextSizeId {
  const index = TEXT_SIZES.findIndex((size) => size.id === current)
  return TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, index + step))]?.id ?? current
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
 * Lo que la versión 1 guardaba en un solo `theme` (Terracota, Noche, Alto
 * contraste, Oliva, Pizarra, Vino o «Según el sistema») pasa a modo, acento y
 * contraste sin perder la elección: Noche era el oscuro con acento Terracota;
 * «Según el sistema» sigue el dispositivo; el alto contraste era claro.
 */
function modeAndColorFromLegacy(theme: unknown): ColorChoice {
  const { mode, accent, contrast } = DEFAULT_APPEARANCE
  if (theme === 'night') {
    return { mode: 'dark', accent, contrast }
  }
  if (theme === 'system') {
    return { mode: 'system', accent, contrast }
  }
  if (theme === 'contrast') {
    return { mode, accent, contrast: 'high' }
  }
  return { mode, accent: pick(ACCENTS, theme, accent), contrast }
}

function colorOf(parsed: Record<string, unknown>): ColorChoice {
  if (parsed['version'] === LEGACY_VERSION) {
    return modeAndColorFromLegacy(parsed['theme'])
  }
  return {
    mode: pick(MODES, parsed['mode'], DEFAULT_APPEARANCE.mode),
    accent: pick(ACCENTS, parsed['accent'], DEFAULT_APPEARANCE.accent),
    contrast: parsed['contrast'] === 'high' ? 'high' : 'normal',
  }
}

/**
 * Lo guardado, leído con desconfianza: cada preferencia inválida vuelve a su
 * valor por omisión sin tirar las demás, la versión 1 se convierte a la actual,
 * y una versión desconocida, un JSON roto o algo que no es un objeto dan las
 * preferencias de fábrica.
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
  if (!isRecord(parsed) || (parsed['version'] !== APPEARANCE_VERSION && parsed['version'] !== LEGACY_VERSION)) {
    return DEFAULT_APPEARANCE
  }
  return {
    ...colorOf(parsed),
    font: pick(FONTS, parsed['font'], DEFAULT_APPEARANCE.font),
    textSize: pick(TEXT_SIZES, parsed['textSize'], DEFAULT_APPEARANCE.textSize),
    density: pick(DENSITIES, parsed['density'], DEFAULT_APPEARANCE.density),
    menu: menuOf(parsed['menu']),
  }
}

/** Lo que se escribe en el almacenamiento. */
export function serializeAppearance(appearance: Appearance): string {
  return JSON.stringify({ version: APPEARANCE_VERSION, ...appearance })
}
