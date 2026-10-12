import { BOTTOM_BAR_SLOTS, type MenuPreference } from '@/services/appearanceRules'
import type { NavEntry } from './navigation'

/** Cómo queda el menú: todas las entradas en orden y cuáles van en la barra de abajo. */
export interface MenuLayout {
  readonly ordered: readonly NavEntry[]
  /** Las de la barra inferior del celular, en el orden del menú. */
  readonly bar: readonly NavEntry[]
  /** Las demás, que el celular muestra en «Más». */
  readonly rest: readonly NavEntry[]
}

/**
 * Las entradas en el orden elegido.
 *
 * `entries` es lo que la cuenta puede ver (sale de sus permisos) y manda: una
 * ruta guardada que ya no está ahí se ignora, y una entrada que el orden guardado
 * no conoce (una pantalla nueva, o un permiso recién dado) va al final, en el
 * orden de fábrica.
 */
export function orderEntries(entries: readonly NavEntry[], order: readonly string[]): readonly NavEntry[] {
  const rank = new Map(order.map((path, index) => [path, index]))
  const known = entries.filter((entry) => rank.has(entry.to)).toSorted((a, b) => (rank.get(a.to) ?? 0) - (rank.get(b.to) ?? 0))
  return [...known, ...entries.filter((entry) => !rank.has(entry.to))]
}

/** El menú ya ordenado y partido en la barra de abajo y «Más». */
export function layoutMenu(entries: readonly NavEntry[], menu: MenuPreference): MenuLayout {
  const ordered = orderEntries(entries, menu.order)
  if (menu.bottom === null) {
    return { ordered, bar: ordered.slice(0, BOTTOM_BAR_SLOTS), rest: ordered.slice(BOTTOM_BAR_SLOTS) }
  }
  const chosen = new Set(menu.bottom)
  const bar = ordered.filter((entry) => chosen.has(entry.to)).slice(0, BOTTOM_BAR_SLOTS)
  const inBar = new Set(bar)
  return { ordered, bar, rest: ordered.filter((entry) => !inBar.has(entry)) }
}

/** El menú tras subir (`-1`) o bajar (`1`) una posición la entrada que está en `index`. */
export function moveEntry(layout: MenuLayout, index: number, step: -1 | 1): MenuPreference {
  const paths = layout.ordered.map((entry) => entry.to)
  const target = index + step
  const from = paths[index]
  const to = paths[target]
  if (from === undefined || to === undefined) {
    return menuOf(layout, paths)
  }
  paths[index] = to
  paths[target] = from
  return menuOf(layout, paths)
}

/** El menú tras poner o sacar una entrada de la barra de abajo (con tope de cuatro). */
export function toggleBottom(layout: MenuLayout, path: string): MenuPreference {
  const bar = layout.bar.map((entry) => entry.to)
  const isInBar = bar.includes(path)
  const hasRoom = bar.length < BOTTOM_BAR_SLOTS
  let next = bar
  if (isInBar) {
    next = bar.filter((item) => item !== path)
  } else if (hasRoom) {
    next = [...bar, path]
  }
  return { order: layout.ordered.map((entry) => entry.to), bottom: next }
}

/** El orden completo ya resuelto, conservando lo elegido para la barra de abajo. */
function menuOf(layout: MenuLayout, paths: readonly string[]): MenuPreference {
  return { order: paths, bottom: layout.bar.map((entry) => entry.to) }
}
