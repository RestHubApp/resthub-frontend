import { ApiFailureNotice } from '@/components/ApiFailureNotice'
import { useFailedQueries } from '@/hooks/useFailedQueries'

/** El aviso de que el servidor no respondió, con su reintento, para las consultas del restaurante. */
export function ServerFailureNotice() {
  const failed = useFailedQueries('restaurant')
  return <ApiFailureNotice message={failed.message} onRetry={failed.retry} />
}
