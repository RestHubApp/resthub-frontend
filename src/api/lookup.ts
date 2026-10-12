import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { DocumentLookup, LookupDocumentType } from './types'

// Consulta de RUC y DNI. Es un tercero (Factiliza): solo se llama cuando la
// persona toca el botón, y nada de lo que devuelve se guarda sin que confirme.

/** Si el servidor tiene la búsqueda encendida; apagada, la interfaz no ofrece el botón. */
export const lookupStatusQuery = queryOptions({
  queryKey: ['lookup', 'status'],
  queryFn: () => send((client) => client.GET('/api/v1/lookup/status')),
  staleTime: 5 * 60_000,
})

/** Busca el nombre o la razón social, la dirección y el estado de un RUC o un DNI. */
export async function lookupDocument(type: LookupDocumentType, number: string): Promise<DocumentLookup> {
  if (type === 'ruc') {
    return send((client) => client.GET('/api/v1/lookup/ruc/{ruc}', { params: { path: { ruc: number } } }))
  }
  return send((client) => client.GET('/api/v1/lookup/dni/{dni}', { params: { path: { dni: number } } }))
}
