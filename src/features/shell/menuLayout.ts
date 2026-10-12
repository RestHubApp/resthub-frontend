import { BOTTOM_BAR_SLOTS, type MenuPreference } from '@/services/appearanceRules'
import { defaultBottomPaths } from './defaultBottomBar'
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

/**
 * El menú ya ordenado y partido en la barra de abajo y «Más».
 *
 * Sin barra elegida rige la de fábrica, que sale de lo que la cuenta puede abrir
 * (`defaultBottomPaths`), no del nombre de su rol.
 */
export function layoutMenu(entries: readonly NavEntry[], menu: MenuPreference): MenuLayout {
  const ordered = orderEntries(entries, menu.order)
  const chosen = new Set(menu.bottom ?? defaultBottomPaths(ordered))
  const bar = ordered.filter((entry) => chosen.has(entry.to)).slice(0, BOTTOM_BAR_SLOTS)
  const inBar = new Set(bar)
  return { ordered, bar, rest: ordered.filter((entry) => !inBar.has(entry)) }
}

/** Los dos grupos del editor: la barra de abajo del celular y lo que queda en «Más». */
export type MenuGroup = 'bar' | 'rest'

/** Mover la entrada que está en `from` al lugar `to` de su grupo. */
export interface GroupMove {
  readonly group: MenuGroup
  readonly from: number
  readonly to: number
}

/**
 * El menú tras mover, dentro de su grupo, la entrada que está en `from` al lugar `to`
 * (subir o bajar una posición, o soltar tras arrastrar). Los lugares que el grupo
 * ocupa en el orden del menú se reparten en la nueva secuencia: las demás entradas
 * no se mueven. `null` si no hay nada que mover.
 */
export function reorderWithin(layout: MenuLayout, move: GroupMove): MenuPreference | null {
  const { group, from, to } = move
  const members = (group === 'bar' ? layout.bar : layout.rest).map((entry) => entry.to)
  if (from === to || members[from] === undefined || members[to] === undefined) {
    return null
  }
  const moved = [...members]
  const [item] = moved.splice(from, 1)
  moved.splice(to, 0, item ?? '')
  const slots = new Set(members)
  const sequence = [...moved]
  const paths = layout.ordered.map((entry) => (slots.has(entry.to) ? (sequence.shift() ?? entry.to) : entry.to))
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
