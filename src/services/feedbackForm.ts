/**
 * El formulario donde el personal cuenta si algo va lento, pesa mucho o gasta
 * batería o datos (`VITE_FEEDBACK_FORM_URL`, por ejemplo un Google Forms). Sin
 * la variable, o si no es una dirección https, el perfil no ofrece el enlace.
 */
export function parseFeedbackFormUrl(value: string | undefined): string | undefined {
  const text = value?.trim() ?? ''
  if (text === '' || !URL.canParse(text)) {
    return undefined
  }
  const url = new URL(text)
  return url.protocol === 'https:' ? url.href : undefined
}

export const FEEDBACK_FORM_URL = parseFeedbackFormUrl(import.meta.env.VITE_FEEDBACK_FORM_URL)
