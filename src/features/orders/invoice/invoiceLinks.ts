const PERU_CODE = '51'
const PERU_MOBILE_LENGTH = 9

/** Un enlace que viene del proveedor o de Drive solo se usa si es una dirección https. */
export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * El número para `wa.me`: solo dígitos, con el 51 si es un celular peruano de
 * 9 dígitos. Devuelve `''` si no hay número o no sirve (por ejemplo, uno enmascarado).
 */
export function whatsappNumber(phone: string): string {
  const digits = phone.replaceAll(/[\s+()-]/gu, '')
  if (!/^\d{8,15}$/u.test(digits)) {
    return ''
  }
  return digits.length === PERU_MOBILE_LENGTH && digits.startsWith('9') ? `${PERU_CODE}${digits}` : digits
}

interface WhatsappMessage {
  /** «Boleta B001-15». */
  readonly label: string
  readonly pdfUrl: string
}

/**
 * El enlace que abre WhatsApp con un mensaje corto y el PDF. Sin número del
 * cliente, `wa.me/?text=` deja elegir a quién enviarlo.
 */
export function whatsappLink(phone: string, { label, pdfUrl }: WhatsappMessage): string {
  const text = encodeURIComponent(`Hola, te comparto tu ${label}: ${pdfUrl}`)
  return `https://wa.me/${whatsappNumber(phone)}?text=${text}`
}
