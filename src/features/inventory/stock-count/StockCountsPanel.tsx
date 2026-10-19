import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { stockCountsQuery } from '@/api/stockCounts'
import { SectionCard } from '@/components/SectionCard'
import { CurrentCount } from './CurrentCount'
import { StartCountDialog } from './StartCountDialog'
import { StockCountHistory } from './StockCountHistory'

/**
 * La pestaña de conteos físicos: el que está en curso (uno por local) o el
 * botón para empezar uno, y el historial con sus reportes de diferencias.
 */
export function StockCountsPanel({ canManage }: { readonly canManage: boolean }) {
  const current = useQuery(stockCountsQuery({ status: 'draft', limit: 1 }))
  const [isStarting, setIsStarting] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {current.isSuccess ? (
        <CurrentCount
          draft={current.data.items[0]}
          canManage={canManage}
          onStart={() => {
            setIsStarting(true)
          }}
        />
      ) : null}
      <SectionCard title="Historial de conteos">
        <StockCountHistory />
      </SectionCard>
      {canManage ? (
        <StartCountDialog
          open={isStarting}
          onClose={() => {
            setIsStarting(false)
          }}
        />
      ) : null}
    </div>
  )
}
