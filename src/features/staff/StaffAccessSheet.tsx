import { useInfiniteQuery } from '@tanstack/react-query'

import { staffAccessHistoryQuery } from '@/api/accessHistory'
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
  const history = useInfiniteQuery({ ...staffAccessHistoryQuery(account.id), enabled: open })
  const accesses = (history.data?.pages ?? []).flatMap((page) => page.items).map((entry) => describeAccess(entry, timeZone))

  return (
    <DetailSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title={`Accesos de ${account.full_name}`}
      description="Los intentos de entrar con su cuenta en los últimos 90 días."
    >
      <AccessHistoryPanel label={`Accesos de ${account.full_name}`} history={history} accesses={accesses} />
    </DetailSheet>
  )
}
