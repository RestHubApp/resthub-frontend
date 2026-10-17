import { useQueryClient } from '@tanstack/react-query'

import { unusedStaffQuery } from '@/api/accountSecurity'
import type { UnusedStaff } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { useStaffStatus } from './useStaffStatus'

function unusedText({ last_activity_at, unused_days }: UnusedStaff): string {
  const days = unused_days === 1 ? '1 día' : `${String(unused_days)} días`
  return last_activity_at === null ? `Nunca entró · creada hace ${days}` : `Sin uso hace ${days}`
}

/** Una cuenta sin uso, con su botón para desactivarla. */
export function UnusedStaffRow({ entry }: { readonly entry: UnusedStaff }) {
  const { member } = entry
  const queryClient = useQueryClient()
  const status = useStaffStatus(member)
  const deactivate = () => {
    status.mutate(`Sin uso en ${String(entry.unused_days)} días (revisión de accesos).`, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: unusedStaffQuery.queryKey }) } })
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 font-medium break-words">{`${member.full_name} · ${member.role_label}`}</p>
        <p className="m-0 text-sm text-muted-foreground">{unusedText(entry)}</p>
        {status.isError ? <ErrorMessage error={status.error} fallback="No se pudo desactivar la cuenta." /> : null}
      </div>
      <ConfirmDialog
        trigger={<Button type="button" size="sm" variant="outline" disabled={status.isPending}>Desactivar</Button>}
        title={`¿Desactivar a ${member.full_name}?`}
        description="Se cierran sus sesiones abiertas y no podrá entrar hasta que vuelvas a activar su cuenta. Sus pedidos y registros se conservan."
        confirmLabel="Desactivar"
        onConfirm={deactivate}
      />
    </li>
  )
}
