import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import type { useRevealContact } from './useRevealContact'

interface RevealContactProps {
  readonly reveal: ReturnType<typeof useRevealContact>['reveal']
}

/**
 * Teléfono y correo llegan enmascarados a quien no gestiona clientes
 * (`masked`). «Ver completo» los pide y el servidor deja anotado quién los vio.
 */
export function RevealContact({ reveal }: RevealContactProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
      <p className="m-0 text-sm text-muted-foreground">
        El teléfono y el correo se muestran ocultos. Queda registrado quién los ve.
      </p>
      {reveal.isError ? <ErrorMessage error={reveal.error} fallback="No se pudo mostrar el dato." /> : null}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={reveal.isPending}
        onClick={() => {
          reveal.mutate()
        }}
      >
        {reveal.isPending ? 'Abriendo…' : 'Ver completo'}
      </Button>
    </div>
  )
}
