import { ApiFailureNotice } from '@/components/ApiFailureNotice'
import { useFailedQueries } from '@/hooks/useFailedQueries'

/** El aviso de que el servidor no respondió, con su reintento,. */
export function ServerFailureNotice() {
  const failed = useFailedQueries()
  return <ApiFailureNotice message={failed.message} onRetry={failed.retry} />
}
