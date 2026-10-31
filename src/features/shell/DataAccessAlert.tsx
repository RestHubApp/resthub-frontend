import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { activityQueryKey } from '@/api/activity'
import { PERMISSION } from '@/api/permissions'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { useServerEvent } from '@/hooks/useServerEvent'
import { paths } from '@/services/paths'
import { useCan, usePreview, useStaffAccount } from '@/store/session'
import { Button } from '@/components/ui/button'

/**
 * Para quien ve la bitácora: el servidor avisa (`dlp_alert`) cuando una cuenta
 * abrió o exportó muchas fichas de clientes en poco tiempo. El aviso no trae
 * datos: dice que pasó y lleva a la bitácora ya filtrada para ver quién fue.
 */
export function DataAccessAlert() {
  const canRead = useCan(PERMISSION.activityRead)
  const isPreview = usePreview()
  const isStaff = useStaffAccount() !== null
  const queryClient = useQueryClient()
  const [isShown, setIsShown] = useState(false)

  useServerEvent(
    'dlp_alert',
    () => {
      setIsShown(true)
      void queryClient.invalidateQueries({ queryKey: activityQueryKey })
    },
    canRead && isStaff && !isPreview,
  )

  if (!isShown) {
    return null
  }
  return (
    <div className="mx-auto w-full max-w-app px-4 pt-3 sm:px-6">
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <Icon glyph={icons.alert} size={18} className="shrink-0 text-destructive" />
        <p className="m-0 min-w-0 flex-1 font-medium">Alguien abrió muchas fichas de clientes en poco tiempo.</p>
        <Link to={paths.activityLogAccess} className="inline-flex min-h-11 items-center underline underline-offset-4">
          Ver en la bitácora
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsShown(false)
          }}
        >
          Descartar
        </Button>
      </div>
    </div>
  )
}
