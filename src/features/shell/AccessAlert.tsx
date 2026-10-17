import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { ownAccessHistoryQueryKey } from '@/api/accessHistory'
import { PERMISSION } from '@/api/permissions'
import { staffQueryKey } from '@/api/staff'
import { Button } from '@/components/ui/button'
import { useServerEvent } from '@/hooks/useServerEvent'
import { paths } from '@/services/paths'
import { useCan, usePreview, useStaffAccount } from '@/store/session'
import { ShellIcon } from './ShellIcon'

/**
 * El servidor avisa (`access_alert`, RFS-16) cuando alguien entra con una
 * cuenta desde un dispositivo o un país que esa cuenta no había usado. Le
 * llega a la cuenta y a quien administra al personal. El aviso no trae datos:
 * lleva al historial de accesos.
 */
export function AccessAlert() {
  const canManageStaff = useCan(PERMISSION.staffManage)
  const isPreview = usePreview()
  const isStaff = useStaffAccount() !== null
  const queryClient = useQueryClient()
  const [isShown, setIsShown] = useState(false)

  useServerEvent(
    'access_alert',
    () => {
      setIsShown(true)
      void queryClient.invalidateQueries({ queryKey: ownAccessHistoryQueryKey })
      void queryClient.invalidateQueries({ queryKey: staffQueryKey })
    },
    isStaff && !isPreview,
  )

  if (!isShown) return null
  return (
    <div className="mx-auto w-full max-w-app px-4 pt-3 sm:px-6">
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <ShellIcon name="alert" size={18} className="shrink-0 text-destructive" />
        <p className="m-0 min-w-0 flex-1 font-medium">Alguien entró desde un dispositivo o un país nuevo. Si no fuiste tú, cambia tu contraseña.</p>
        <Link to={paths.profile} className="inline-flex min-h-11 items-center underline underline-offset-4">Ver mis accesos</Link>
        {canManageStaff ? <Link to={paths.staff} className="inline-flex min-h-11 items-center underline underline-offset-4">Ver el personal</Link> : null}
        <Button type="button" variant="outline" size="sm" onClick={() => { setIsShown(false) }}>Descartar</Button>
      </div>
    </div>
  )
}
