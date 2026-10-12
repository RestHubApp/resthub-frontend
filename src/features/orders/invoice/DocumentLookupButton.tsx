import { useMutation } from '@tanstack/react-query'

import { lookupDocument } from '@/api/lookup'
import type { DocumentLookup, LookupDocumentType } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatProblem } from './documentFormat'
import { LookupFeedback } from './LookupFeedback'
import { useLookupEnabled } from './useLookupEnabled'

interface DocumentLookupButtonProps {
  readonly type: LookupDocumentType
  readonly number: string
  /** Recibe lo encontrado; quien llama lo pone en campos editables, sin guardar nada. */
  readonly onFound: (found: DocumentLookup) => void
}

/**
 * «Buscar en SUNAT/RENIEC»: rellena el nombre o la razón social y la dirección
 * del documento escrito. La consulta va a un tercero (Factiliza) y solo ocurre al
 * tocar el botón. Se ofrece solo si el servidor la tiene encendida y la cuenta
 * puede emitir comprobantes o gestionar clientes.
 */
export function DocumentLookupButton({ type, number, onFound }: DocumentLookupButtonProps) {
  const isEnabled = useLookupEnabled()
  const search = useMutation({ mutationFn: () => lookupDocument(type, number.trim()), onSuccess: onFound })
  const format = formatProblem(type, number.trim())

  if (!isEnabled) {
    return null
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={search.isPending || format !== null}
        onClick={() => {
          search.mutate()
        }}
      >
        {search.isPending ? 'Buscando…' : 'Buscar en SUNAT/RENIEC'}
      </Button>
      <LookupFeedback problem={number.trim() === '' ? null : format} error={search.error} found={search.data} />
    </div>
  )
}
