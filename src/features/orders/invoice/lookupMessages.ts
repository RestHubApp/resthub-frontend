import { errorCode } from '@/services/apiError'

const MESSAGES: Readonly<Record<string, string>> = {
  invalid_document_number: 'El número no tiene el formato correcto. Revísalo.',
  document_not_found: 'No se encontró en SUNAT o RENIEC. Escribe los datos a mano.',
  lookup_disabled: 'La búsqueda no está disponible. Escribe los datos a mano.',
  lookup_rate_limited: 'Hiciste muchas búsquedas seguidas. Espera un momento y vuelve a intentarlo.',
  lookup_unavailable: 'SUNAT y RENIEC no responden ahora. Escribe los datos a mano o inténtalo en unos minutos.',
}

/** El mensaje para quien buscó un documento y no obtuvo respuesta, según el código del error. */
export function lookupErrorMessage(error: unknown): string {
  const code = errorCode(error)
  return (code === undefined ? undefined : MESSAGES[code]) ?? 'No se pudo buscar. Escribe los datos a mano.'
}

/** El aviso de un RUC que no figura activo y habido en SUNAT, o `null` si está en regla. */
export function rucWarning(status: string | null, condition: string | null): string | null {
  const problems = [
    status !== null && status.toUpperCase() !== 'ACTIVO' ? `estado ${status}` : '',
    condition !== null && condition.toUpperCase() !== 'HABIDO' ? `condición ${condition}` : '',
  ].filter((problem) => problem !== '')
  if (problems.length === 0) {
    return null
  }
  return `Ojo: en SUNAT este RUC figura con ${problems.join(' y ')}. Confirma con el cliente antes de emitir.`
}
