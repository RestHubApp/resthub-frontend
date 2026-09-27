import RetryQueryError from './RetryQueryError'

interface ApiFailureNoticeProps {
  readonly message: string | null
  readonly onRetry: () => void
}

// Un aviso por falla. El del armazón es de respaldo: se calla si la pantalla
// (el `main` que le sigue) o una ventana abierta ya muestran su propio error,
// que dice más porque está junto a lo que falló. Queda para las lecturas que
// ninguna pantalla muestra, así ninguna ruta se queda en blanco.
const CALLA_SI_HAY_OTRO =
  '[&:has(~_#contenido_[data-falla=propia])]:hidden [body:has([role=dialog]_[data-falla])_&]:hidden'

/** El mismo error con reintento de las lecturas, en el armazón de cada área. */
export default function ApiFailureNotice({ message, onRetry }: ApiFailureNoticeProps) {
  if (message === null) return null
  return (
    <div className={`mx-auto w-full max-w-[1100px] px-4 pt-3 sm:px-6 ${CALLA_SI_HAY_OTRO}`}>
      <RetryQueryError message={message} onRetry={onRetry} fallback />
    </div>
  )
}
