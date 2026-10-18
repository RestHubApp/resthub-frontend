import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ACCESS_PAGE_SIZE, staffAccessHistoryQuery } from '@/api/accessHistory'
import type { StaffResponse } from '@/api/types'
import { AccessHistoryPanel } from '@/components/AccessHistoryPanel'
import { DetailSheet } from '@/components/DetailSheet'
import { describeAccess } from '@/services/accessHistory'
import { useTimeZone } from '@/store/session'

interface StaffAccessSheetProps {
  readonly account: StaffResponse
  readonly open: boolean
  readonly onClose: () => void
}

/** Los accesos de una persona del personal (RFS-15): cuándo entró o intentó entrar, y desde dónde. */
export function StaffAccessSheet({ account, open, onClose }: StaffAccessSheetProps) {
  const timeZone = useTimeZone()
  const [limit, setLimit] = useState(ACCESS_PAGE_SIZE)
  const history = useQuery({ ...staffAccessHistoryQuery(account.id, limit), enabled: open, placeholderData: keepPreviousData })
  const accesses = (history.data?.items ?? []).map((entry) => describeAccess(entry, timeZone))

  return (
    <DetailSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title={`Accesos de ${account.full_name}`}
      description="Los intentos de entrar con su cuenta en los últimos 90 días."
    >
      <AccessHistoryPanel label={`Accesos de ${account.full_name}`} history={history} accesses={accesses} onMore={() => { setLimit(limit + ACCESS_PAGE_SIZE) }} />
    </DetailSheet>
  )
}
