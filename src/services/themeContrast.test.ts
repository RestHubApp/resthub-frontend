import { describe, expect, it, jest } from '@jest/globals'

import { THEMES } from './appearanceRules'

// Lee los temas de `src/index.css` y comprueba el contraste de sus pares de
// color (WCAG 2.2 AA). Lo que `index.css` dice de cada tema es lo que esta
// prueba mide: un tema nuevo o un color cambiado que baje de los mínimos falla.

type Rgb = readonly [number, number, number]
type Tokens = Record<string, string>

// Jest corre en la raíz del proyecto. Las pruebas de `src` no tienen los tipos de Node: se pide `fs` con el tipo mínimo.
const { readFileSync } = jest.requireActual<{ readFileSync: (file: string, encoding: 'utf8') => string }>('node:fs')
const CSS = readFileSync('src/index.css', 'utf8').replaceAll(/\/\*[\s\S]*?\*\//gu, '')

const THEME_SELECTOR = /^\[data-theme='([\w-]+)'\]$/u
const ROOT = ':root'
const DEFAULT_THEME = 'terracotta'
const MUTED = 'muted-foreground'
const BORDER_MINIMUM = 3
const TEXT_MINIMUM = 4.5

/** El tema que declara un selector: `[data-theme='wine']` es Vino; `:root` es el de fábrica. */
function themeOf(selector: string): string[] {
  const trimmed = selector.trim()
  if (trimmed === ROOT) {
    return [DEFAULT_THEME]
  }
  const id = THEME_SELECTOR.exec(trimmed)?.[1]
  return id === undefined ? [] : [id]
}

/** Las declaraciones de un bloque: `--nombre: valor` (sin los guiones) y el `color-scheme`. */
function declarationsOf(body: string): Tokens {
  const pairs = body.split(';').flatMap((line) => {
    const colon = line.indexOf(':')
    const name = line.slice(0, colon).trim()
    const isToken = name.startsWith('--')
    return isToken || name === 'color-scheme' ? [[isToken ? name.slice(2) : name, line.slice(colon + 1).trim()] as const] : []
  })
  return Object.fromEntries(pairs)
}

/** Los tokens de cada tema, juntando todos los bloques que lo nombran. */
function readThemes(): Record<string, Tokens> {
  const themes: Record<string, Tokens> = {}
  for (const chunk of CSS.split('}')) {
    const open = chunk.lastIndexOf('{')
    const ids = open < 0 ? [] : chunk.slice(0, open).split(',').flatMap(themeOf)
    for (const id of ids) {
      themes[id] = { ...themes[id], ...declarationsOf(chunk.slice(open + 1)) }
    }
  }
  return themes
}

const THEME_TOKENS = readThemes()

function toRgb(hex: string): Rgb {
  const parts = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex)
  if (parts === null) {
    throw new Error(`Color que no es #rrggbb: ${hex}`)
  }
  const [red = 0, green = 0, blue = 0] = parts.slice(1).map((part) => Number.parseInt(part, 16) / 255)
  return [red, green, blue]
}

const linear = (value: number) => (value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

function luminance([red, green, blue]: Rgb): number {
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

function ratio(first: Rgb, second: Rgb): number {
  const light = Math.max(luminance(first), luminance(second))
  const dark = Math.min(luminance(first), luminance(second))
  return (light + 0.05) / (dark + 0.05)
}

/** `color` al `amount` por ciento sobre `base` (lo que hace `bg-success/10`). */
function over(color: Rgb, base: Rgb, amount: number): Rgb {
  const [red = 0, green = 0, blue = 0] = color.map((value, index) => value * amount + (base[index] ?? 0) * (1 - amount))
  return [red, green, blue]
}

const encode = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped <= 0.003_130_8 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
}

/** `color-mix(in oklch, color, black 12%)`: baja la luminosidad y el croma, el matiz queda. */
function darken(color: Rgb, amount: number): Rgb {
  const [red, green, blue] = color.map(linear) as [number, number, number]
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
  const keep = 1 - amount
  const lightness = keep * (0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short)
  const a = keep * (1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short)
  const b = keep * (0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short)
  const cubeLong = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const cubeMedium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const cubeShort = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    encode(4.0767416621 * cubeLong - 3.3077115913 * cubeMedium + 0.2309699292 * cubeShort),
    encode(-1.2684380046 * cubeLong + 2.6097574011 * cubeMedium - 0.3413193965 * cubeShort),
    encode(-0.0041960863 * cubeLong - 0.7034186147 * cubeMedium + 1.707614701 * cubeShort),
  ]
}

function colorOf(theme: string, token: string): Rgb {
  const value = THEME_TOKENS[theme]?.[token]
  if (value === undefined) {
    throw new Error(`El tema ${theme} no define --${token}`)
  }
  return toRgb(value)
}

/** Un par medido: su nombre, el mínimo que debe dar y lo que da. */
type Measure = readonly [name: string, minimum: number, actual: number]

function statesOf(theme: string): Measure[] {
  const card = colorOf(theme, 'card')
  return ['destructive', 'success', 'warning'].flatMap((token) => {
    const text = colorOf(theme, token)
    return [
      [`${token} sobre el fondo`, TEXT_MINIMUM, ratio(text, colorOf(theme, 'background'))],
      [`${token} sobre la tarjeta`, TEXT_MINIMUM, ratio(text, card)],
      [`${token} sobre su tinte al 10 %`, TEXT_MINIMUM, ratio(text, over(text, card, 0.1))],
      [`${token} sobre su tinte al 20 %`, TEXT_MINIMUM, ratio(text, over(text, card, 0.2))],
    ] as const
  })
}

function measures(theme: string): readonly Measure[] {
  const plain = (name: string, text: string, background: string, minimum: number): Measure => [
    name,
    minimum,
    ratio(colorOf(theme, text), colorOf(theme, background)),
  ]
  const hover = darken(colorOf(theme, 'primary'), 0.12)
  return [
    plain('texto sobre el fondo', 'foreground', 'background', 7),
    plain('texto sobre la tarjeta', 'card-foreground', 'card', 7),
    plain('texto del menú emergente', 'popover-foreground', 'popover', 7),
    plain('texto apagado sobre el fondo', MUTED, 'background', TEXT_MINIMUM),
    plain('texto apagado sobre la tarjeta', MUTED, 'card', TEXT_MINIMUM),
    plain('texto apagado sobre lo apagado', MUTED, 'muted', TEXT_MINIMUM),
    plain('texto del botón principal', 'primary-foreground', 'primary', TEXT_MINIMUM),
    ['texto del botón principal al pasar el puntero', TEXT_MINIMUM, ratio(colorOf(theme, 'primary-foreground'), hover)],
    plain('principal como texto sobre el fondo', 'primary', 'background', TEXT_MINIMUM),
    plain('principal como texto sobre la tarjeta', 'primary', 'card', TEXT_MINIMUM),
    plain('texto secundario', 'secondary-foreground', 'secondary', TEXT_MINIMUM),
    plain('texto de acento', 'accent-foreground', 'accent', TEXT_MINIMUM),
    plain('texto del aviso de éxito', 'success-foreground', 'success', TEXT_MINIMUM),
    plain('texto del menú lateral', 'sidebar-foreground', 'sidebar', 7),
    plain('texto del menú lateral marcado', 'sidebar-primary-foreground', 'sidebar-primary', TEXT_MINIMUM),
    plain('texto del menú lateral con acento', 'sidebar-accent-foreground', 'sidebar-accent', TEXT_MINIMUM),
    plain('borde de campo sobre el fondo', 'input', 'background', BORDER_MINIMUM),
    plain('borde de campo sobre la tarjeta', 'input', 'card', BORDER_MINIMUM),
    plain('anillo de foco sobre el fondo', 'ring', 'background', BORDER_MINIMUM),
    plain('anillo de foco sobre la tarjeta', 'ring', 'card', BORDER_MINIMUM),
    ...statesOf(theme),
    ...[1, 2, 3, 4, 5].map((n) => plain(`gráfico ${String(n)} sobre la tarjeta`, `chart-${String(n)}`, 'card', BORDER_MINIMUM)),
  ]
}

const IDS = THEMES.map((theme) => theme.id)
// Lo que no es color: la letra, el radio y el tamaño de los controles viven en la raíz.
const NOT_COLORS = new Set(['app-font', 'radius', 'control-h', 'control-h-sm', 'control-h-lg'])

describe('temas de index.css', () => {
  it('index.css declara exactamente los temas de la aplicación', () => {
    expect(Object.keys(THEME_TOKENS).toSorted((a, b) => a.localeCompare(b))).toEqual(IDS.toSorted((a, b) => a.localeCompare(b)))
  })

  it.each(IDS)('el tema %s define todos los colores que usan los componentes', (id) => {
    const reference = Object.keys(THEME_TOKENS[DEFAULT_THEME] ?? {}).filter((token) => !NOT_COLORS.has(token))
    const missing = reference.filter((token) => THEME_TOKENS[id]?.[token] === undefined)
    expect(missing).toEqual([])
  })

  it.each(IDS)('el tema %s cumple el contraste mínimo en cada par de colores', (id) => {
    const failing = measures(id)
      .filter(([, minimum, actual]) => actual < minimum)
      .map(([name, minimum, actual]) => `${name}: ${actual.toFixed(2)} a 1 (mínimo ${String(minimum)})`)
    expect(failing).toEqual([])
  })

  it('cada tema declara qué esquema usa el navegador (color-scheme)', () => {
    for (const { id, scheme } of THEMES) {
      expect(THEME_TOKENS[id]?.['color-scheme']).toBe(scheme)
    }
  })
})
