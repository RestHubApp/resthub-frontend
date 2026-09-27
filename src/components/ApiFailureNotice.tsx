import RetryQueryError from './RetryQueryError'

interface ApiFailureNoticeProps {
  readonly message: string | null
  readonly onRetry: () => void
}

/** El mismo error con reintento de las lecturas, en el armazón de cada área. */
export default function ApiFailureNotice({ message, onRetry }: ApiFailureNoticeProps) {
  if (message === null) return null
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-3 sm:px-6">
      <RetryQueryError message={message} onRetry={onRetry} />
    </div>
  )
}
