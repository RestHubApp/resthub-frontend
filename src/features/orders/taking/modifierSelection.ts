import type { OrderMenuItem } from '@/api/types'
import { toCents } from '@/services/format'
import type { DraftModifier } from './useOrderDraft'

/** Las opciones elegidas de cada grupo, por nombre de grupo. */
export type Selected = Readonly<Record<string, readonly string[]>>

/** Un grupo de opciones de un plato (tamaño, término, extras). */
export type ModifierGroupData = OrderMenuItem['modifier_groups'][number]

interface ToggleChoice {
  readonly selected: Selected
  readonly group: string
  readonly option: string
  /** Cuantas opciones admite el grupo como maximo. */
  readonly max: number
}

/** Marca o desmarca una opcion; con maximo uno se comporta como radio. */
export function toggle({ selected, group, option, max }: ToggleChoice): Selected {
  const current = selected[group] ?? []
  if (current.includes(option)) {
    return { ...selected, [group]: current.filter((name) => name !== option) }
  }
  // Con máximo uno se comporta como radio: elegir otra reemplaza la anterior.
  const next = max === 1 ? [option] : [...current, option].slice(-max)
  return { ...selected, [group]: next }
}

/** Lo que resulta de las opciones elegidas: lo que falta, lo que se suma y el total en centavos. */
export interface SelectionSummary {
  /** Los grupos obligatorios que todavia no tienen la cantidad minima elegida. */
  readonly missing: readonly ModifierGroupData[]
  readonly modifiers: DraftModifier[]
  readonly totalCents: number
}

/** Resume las opciones elegidas de un plato. */
export function summarize(item: OrderMenuItem, selected: Selected): SelectionSummary {
  const groups = item.modifier_groups
  const missing = groups.filter((group) => (selected[group.name] ?? []).length < group.min_choices)
  const modifiers: DraftModifier[] = groups.flatMap((group) =>
    group.options
      .filter((option) => (selected[group.name] ?? []).includes(option.name))
      .map((option) => ({ group: group.name, option: option.name, price: option.price })),
  )
  const totalCents = toCents(item.price) + modifiers.reduce((sum, m) => sum + toCents(m.price), 0)
  return { missing, modifiers, totalCents }
}
