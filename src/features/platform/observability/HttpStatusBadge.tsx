import StatusBadge, { type StatusTone } from '../../../components/StatusBadge'

const SERVER_ERROR = 500
const CLIENT_ERROR = 400
const REDIRECT = 300

function tone(status: number): StatusTone | undefined {
  if (status >= SERVER_ERROR) {
    return 'cancelled'
  }
  if (status >= CLIENT_ERROR) {
    return 'pending'
  }
  return status < REDIRECT ? 'completed' : undefined
}

/** El estado HTTP de una respuesta: el número siempre escrito, el color acompaña. */
export default function HttpStatusBadge({ status }: { readonly status: number }) {
  return <StatusBadge label={String(status)} tone={tone(status)} />
}
