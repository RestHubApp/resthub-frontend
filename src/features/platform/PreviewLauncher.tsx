import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  PASSWORD_MUTATION_GC_TIME,
  platformActivityQueryKey,
  platformMutationKeys,
  platformSandboxQueryKey,
  startPlatformPreview,
} from '@/api/platform'
import type { PreviewAs } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage, errorStatus } from '@/services/api'
import { openPreviewTab, PREVIEW_AS_LABELS, previewUrl } from './previewLink'
import { PreviewOpenedNotice } from './PreviewOpenedNotice'
import { SandboxResetButton } from './SandboxResetButton'

// El local de muestra no tiene una cuenta activa de ese tipo: el servidor
// sugiere reiniciarlo.
const CONFLICT = 409
const MS_BY_SECOND = 1000
const AS: readonly PreviewAs[] = ['owner', 'waiter']

interface Opened {
  readonly as: PreviewAs
  readonly url: string
  readonly expiresInMs: number
}

/**
 * «Ver como encargado» y «Ver como mesero».
 *
 * Pide un código de un solo uso y abre con él una pestaña nueva, que entra al
 * local de muestra con su propia sesión. El código va en el caché de
 * mutaciones solo mientras alguien mira (`gcTime: 0`), como una contraseña.
 */
export function PreviewLauncher() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<Opened | null>(null)
  const start = useMutation({
    mutationKey: platformMutationKeys.startPreview,
    mutationFn: (as: PreviewAs) => startPlatformPreview({ as }),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: ({ code, expires_in: seconds }, as) => {
      const url = previewUrl(code)
      openPreviewTab(url)
      setOpen({ as, url, expiresInMs: seconds * MS_BY_SECOND })
      // La primera vista previa crea el local de muestra; y queda en la bitácora.
      void queryClient.invalidateQueries({ queryKey: platformSandboxQueryKey })
      void queryClient.invalidateQueries({ queryKey: platformActivityQueryKey })
    },
  })

  // Vencido el código, el enlace de repuesto ya no sirve y se quita.
  useEffect(() => {
    if (open === null) {
      return
    }
    const timer = window.setTimeout(() => {
      setOpen(null)
    }, open.expiresInMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [open])

  const handleOpen = (as: PreviewAs) => {
    setOpen(null)
    start.mutate(as)
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex w-full flex-wrap gap-3">
        {AS.map((as) => (
          <Button
            key={as}
            type="button"
            size="lg"
            className="h-11 w-full px-4 sm:w-auto"
            disabled={start.isPending}
            onClick={() => {
              handleOpen(as)
            }}
          >
            <Icon name="ver" size={18} />
            <span>{start.isPending && start.variables === as ? 'Abriendo…' : `Ver como ${PREVIEW_AS_LABELS[as]}`}</span>
          </Button>
        ))}
      </div>
      {open === null ? null : (
        <PreviewOpenedNotice
          label={PREVIEW_AS_LABELS[open.as]}
          url={open.url}
          onUsed={() => {
            setOpen(null)
          }}
        />
      )}
      {start.isError ? (
        <FormMessage tone="error">{errorMessage(start.error, 'No se pudo abrir la vista previa.')}</FormMessage>
      ) : null}
      {errorStatus(start.error) === CONFLICT ? (
        <SandboxResetButton
          exists
          onReset={() => {
            start.reset()
          }}
        />
      ) : null}
    </div>
  )
}
