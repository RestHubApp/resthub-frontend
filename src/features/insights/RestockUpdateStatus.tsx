import { ErrorMessage } from '@/components/ErrorMessage'

interface RestockUpdateStatusProps {
  readonly isPending: boolean
  readonly isError: boolean
  readonly error: unknown
}

/** El estado de pedir recomendaciones nuevas: aviso de espera o error. */
export function RestockUpdateStatus({ isPending, isError, error }: RestockUpdateStatusProps) {
  return (
    <>
      {isPending ? (
        <p role="status" className="m-0 text-sm text-muted-foreground">
          Decidiendo insumo por insumo. Con la IA puede tardar varios segundos.
        </p>
      ) : null}
      {isError ? (
        <ErrorMessage error={error} fallback="No se pudieron actualizar las recomendaciones." />
      ) : null}
    </>
  )
}
