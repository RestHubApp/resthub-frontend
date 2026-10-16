import { type SyntheticEvent, useState } from 'react'

import { recordCountLines } from '@/api/stockCounts'
import type { CountLineRequest, StockCountLine } from '@/api/types'
import { countLinePayload, countOptions, draftOf, readDraft } from './countEntry'
import { useStockCountChange } from './useStockCountChange'

/** Lo escrito en una línea del conteo, su lectura en vivo y el guardado de esa sola línea. */
export function useCountLine(countId: number, line: StockCountLine) {
  const [draft, setDraft] = useState(() => draftOf(line))
  const options = countOptions(line)
  const reading = readDraft(draft, line)
  const record = useStockCountChange(countId, { send: (payload: CountLineRequest) => recordCountLines(countId, [payload]) })
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (reading.base !== null && !record.isPending) {
      record.mutate(countLinePayload(line, draft))
    }
  }
  const clear = (payload: CountLineRequest) => {
    setDraft({ ...draft, quantity: '', fullPackages: '' })
    record.mutate(payload)
  }
  return { draft, setDraft, options, reading, record, submit, clear }
}
