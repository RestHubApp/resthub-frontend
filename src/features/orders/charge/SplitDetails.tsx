import type { OrderResponse } from '../../../api/types'
import type { SplitMode } from './chargeMath'
import EqualSplitField from './EqualSplitField'
import ItemSplitPicker from './ItemSplitPicker'

interface SplitDraft {
  readonly modo: SplitMode
  readonly personas: number
  readonly setPersonas: (personas: number) => void
  readonly platos: readonly number[]
  readonly setPlatos: (platos: number[]) => void
  readonly parte: number
}

interface SplitDetailsProps {
  readonly order: OrderResponse
  readonly draft: SplitDraft
}

/** Lo que pide cada forma de dividir: entre cuántos, o qué platos. Pagar junto no pide nada. */
export default function SplitDetails({ order, draft }: SplitDetailsProps) {
  if (draft.modo === 'equal') {
    return <EqualSplitField remaining={draft.personas} partCents={draft.parte} onChange={draft.setPersonas} />
  }
  if (draft.modo === 'items') {
    return (
      <ItemSplitPicker order={order} selected={draft.platos} chargeCents={draft.parte} onChange={draft.setPlatos} />
    )
  }
  return null
}
