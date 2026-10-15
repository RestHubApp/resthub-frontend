// Los errores de la facturación electrónica que la persona tiene que entender
// sin leer el detalle técnico: el servicio de facturación caído, un
// certificado que no sirve y un archivo del comprobante que todavía no existe.
import type { ErrorCode } from '@/api/types'
import { errorCode, errorMessage } from './apiError'

const MESSAGES: Readonly<Partial<Record<ErrorCode, string>>> = {
  billing_provider: 'El servicio de facturación no está disponible, intenta en unos minutos.',
  invoice_document_unavailable: 'Ese archivo del comprobante todavía no está disponible. Si SUNAT aún no lo aceptó, reenvíalo e inténtalo después.',
}

const INVALID_CERTIFICATE = 'El certificado no es válido o la contraseña no corresponde. Revisa el archivo y la contraseña.'

/**
 * El mensaje de un error de facturación según su código. El de un certificado
 * rechazado conserva el motivo del servidor (falta la llave privada, contraseña
 * equivocada); lo demás que no tiene mensaje propio muestra lo que dijo el
 * servidor o `fallback`.
 */
export function billingErrorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error)
  const known = code === undefined ? undefined : MESSAGES[code]
  if (known !== undefined) return known
  return errorMessage(error, code === 'invalid_certificate' ? INVALID_CERTIFICATE : fallback)
}
