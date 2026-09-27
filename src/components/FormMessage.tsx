interface FormMessageProps {
  readonly tone: 'error' | 'ok'
  readonly children: React.ReactNode
  /**
   * Un error de respaldo (el del armazón o el general de una ventana), que
   * se calla si la pantalla o la ventana ya muestran el suyo. Ver
   * `ApiFailureNotice` y `FormDialog`.
   */
  readonly fallback?: boolean
}

const TONE_CLASSES = {
  error: 'bg-destructive/10 text-destructive',
  ok: 'bg-success/10 text-success',
} as const

/**
 * El resultado de enviar un formulario.
 *
 * Aparece despues de que la persona actuo, lejos de donde mira, asi que se
 * anuncia: un error interrumpe al lector de pantalla y un exito espera turno.
 */
export default function FormMessage({ tone, children, fallback = false }: FormMessageProps) {
  // Una falla se avisa una sola vez: los avisos de respaldo buscan esta marca
  // para no repetir lo que la pantalla ya dice.
  const falla = tone === 'error' ? { 'data-falla': fallback ? 'respaldo' : 'propia' } : {}
  return (
    <p
      {...falla}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`m-0 rounded-lg px-3 py-2 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </p>
  )
}
