import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  PASSWORD_MUTATION_GC_TIME,
  platformActivityQueryKey,
  platformMutationKeys,
  platformSandboxQueryKey,
  startPlatformPreview,
} from '../../api/platform'
import type { PreviewAs } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage, errorStatus } from '../../services/api'
import { openPreviewTab, PREVIEW_AS_LABELS, previewUrl } from './previewLink'
import PreviewOpenedNotice from './PreviewOpenedNotice'
import SandboxResetButton from './SandboxResetButton'

// El local de muestra no tiene una cuenta activa de ese tipo: el servidor
// sugiere reiniciarlo.
const CONFLICT = 409
const MS_POR_SEGUNDO = 1000
const COMO: readonly PreviewAs[] = ['owner', 'waiter']

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
export default function PreviewLauncher() {
  const queryClient = useQueryClient()
  const [abierta, setAbierta] = useState<Opened | null>(null)
  const inicio = useMutation({
    mutationKey: platformMutationKeys.startPreview,
    mutationFn: (as: PreviewAs) => startPlatformPreview({ as }),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: ({ code, expires_in: segundos }, as) => {
      const url = previewUrl(code)
      openPreviewTab(url)
      setAbierta({ as, url, expiresInMs: segundos * MS_POR_SEGUNDO })
      // La primera vista previa crea el local de muestra; y queda en la bitácora.
      void queryClient.invalidateQueries({ queryKey: platformSandboxQueryKey })
      void queryClient.invalidateQueries({ queryKey: platformActivityQueryKey })
    },
  })

  // Vencido el código, el enlace de repuesto ya no sirve y se quita.
  useEffect(() => {
    if (abierta === null) {
      return
    }
    const timer = window.setTimeout(() => {
      setAbierta(null)
    }, abierta.expiresInMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [abierta])

  const abrir = (as: PreviewAs) => {
    setAbierta(null)
    inicio.mutate(as)
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex w-full flex-wrap gap-3">
        {COMO.map((as) => (
          <Button
            key={as}
            type="button"
            size="lg"
            className="h-11 flex-1 px-4 sm:flex-none"
            disabled={inicio.isPending}
            onClick={() => {
              abrir(as)
            }}
          >
            <Icon name="ver" size={18} />
            <span>{inicio.isPending && inicio.variables === as ? 'Abriendo…' : `Ver como ${PREVIEW_AS_LABELS[as]}`}</span>
          </Button>
        ))}
      </div>
      {abierta === null ? null : (
        <PreviewOpenedNotice
          label={PREVIEW_AS_LABELS[abierta.as]}
          url={abierta.url}
          onUsed={() => {
            setAbierta(null)
          }}
        />
      )}
      {inicio.isError ? (
        <FormMessage tone="error">{errorMessage(inicio.error, 'No se pudo abrir la vista previa.')}</FormMessage>
      ) : null}
      {errorStatus(inicio.error) === CONFLICT ? (
        <SandboxResetButton
          exists
          onReset={() => {
            inicio.reset()
          }}
        />
      ) : null}
    </div>
  )
}
