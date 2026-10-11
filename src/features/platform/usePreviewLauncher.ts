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
import { openPreviewTab, previewUrl } from './previewLink'

const MS_BY_SECOND = 1000

/** La vista previa recién abierta: con qué rol, a dónde y cuánto dura el código. */
export interface OpenedPreview {
  readonly as: PreviewAs
  readonly url: string
  readonly expiresInMs: number
}

/**
 * El estado de «Ver como…»: pide el código de un solo uso, abre la pestaña y
 * recuerda la vista abierta hasta que el código vence.
 */
export function usePreviewLauncher() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<OpenedPreview | null>(null)
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
  const close = () => {
    setOpen(null)
  }

  return { start, open, handleOpen, close }
}
