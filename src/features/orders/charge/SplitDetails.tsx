import type { OrderResponse } from '@/api/types'
import type { SplitMode } from './chargeMath'
import { EqualSplitField } from './EqualSplitField'
import { ItemSplitPicker } from './ItemSplitPicker'

interface SplitDraft {
  readonly mode: SplitMode
  readonly personas: number
  readonly setPersonas: (personas: number) => void
  readonly dishes: readonly number[]
  readonly setDishes: (dishes: number[]) => void
  readonly part: number
}

interface SplitDetailsProps {
  readonly order: OrderResponse
  readonly draft: SplitDraft
}

/** Lo que pide cada forma de dividir: entre cuántos, o qué platos. Pagar junto no pide nada. */
export function SplitDetails({ order, draft }: SplitDetailsProps) {
  if (draft.mode === 'equal') {
    return <EqualSplitField remaining={draft.personas} partCents={draft.part} onChange={draft.setPersonas} />
  }
  if (draft.mode === 'items') {
    return (
      <ItemSplitPicker order={order} selected={draft.dishes} chargeCents={draft.part} onChange={draft.setDishes} />
    )
  }
  return null
}
