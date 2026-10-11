import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { aiDecisionsQuery } from '@/api/insights'
import type { AiDecisionParams, DecisionEngine, DecisionKind } from '@/api/types'

const PAGE_SIZE = 20

// Un filtro vacío no viaja: el servidor lo entiende como "todos".
function queryParams(kind: DecisionKind | '', engine: DecisionEngine | '', page: number): AiDecisionParams {
  return {
    ...(kind === '' ? {} : { kind }),
    ...(engine === '' ? {} : { engine }),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }
}

/**
 * Las decisiones de la IA con sus filtros y su página.
 *
 * Cambiar un filtro vuelve a la primera página; mientras llega la siguiente se
 * conserva la anterior.
 */
export function useAiDecisions() {
  const [kind, setKind] = useState<DecisionKind | ''>('')
  const [engine, setEngine] = useState<DecisionEngine | ''>('')
  const [page, setPage] = useState(0)
  const decisions = useQuery({
    ...aiDecisionsQuery(queryParams(kind, engine, page)),
    placeholderData: keepPreviousData,
  })
  const total = decisions.data?.total ?? 0

  return {
    kind,
    engine,
    page,
    decisions,
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    setPage,
    changeKind: (value: DecisionKind | '') => {
      setKind(value)
      setPage(0)
    },
    changeEngine: (value: DecisionEngine | '') => {
      setEngine(value)
      setPage(0)
    },
  }
}
