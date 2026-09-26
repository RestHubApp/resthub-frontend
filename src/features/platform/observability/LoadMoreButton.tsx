import { Button } from '../../../components/ui/button'

interface LoadMoreButtonProps {
  readonly shown: number
  readonly hasMore: boolean
  readonly loading: boolean
  readonly onLoad: () => void
  /** Qué se cuenta: «entradas», «peticiones». */
  readonly noun: string
}

/** Cuántas se ven y «Cargar más», que pide las anteriores a la última de la lista. */
export default function LoadMoreButton({ shown, hasMore, loading, onLoad, noun }: LoadMoreButtonProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {`${String(shown)} ${noun}${hasMore ? '; hay más' : ''}`}
      </p>
      {hasMore ? (
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" disabled={loading} onClick={onLoad}>
          {loading ? 'Cargando…' : 'Cargar más'}
        </Button>
      ) : null}
    </div>
  )
}
