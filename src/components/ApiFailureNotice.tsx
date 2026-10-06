import RetryQueryError from './RetryQueryError'

interface ApiFailureNoticeProps {
  readonly message: string | null
  readonly onRetry: () => void
}

// Un aviso por falla. El del armazón es de respaldo: se calla si la pantalla
// (el `main` que le sigue) ya muestra su propio error con «Reintentar»
// (`data-reintento`), que dice más porque está junto a lo que falló, o si hay
// una ventana abierta con su error. Un error de la pantalla sin «Reintentar» no
// lo calla: si no, esa pantalla quedaba sin forma de volver a pedir los datos.
const CALLA_SI_HAY_OTRO =
  '[&:has(~_#contenido_[data-reintento])]:hidden [body:has([role=dialog]_[data-falla])_&]:hidden'

/** El mismo error con reintento de las lecturas, en el armazón de cada área. */
export default function ApiFailureNotice({ message, onRetry }: ApiFailureNoticeProps) {
  if (message === null) return null
  return (
    <div className={`mx-auto w-full max-w-[1100px] px-4 pt-3 sm:px-6 ${CALLA_SI_HAY_OTRO}`}>
      <RetryQueryError message={message} onRetry={onRetry} fallback />
    </div>
  )
}
