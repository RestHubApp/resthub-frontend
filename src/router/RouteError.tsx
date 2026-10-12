import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

/**
 * Lo que se ve cuando una ruta falla al renderizar, cargar su archivo o
 * ejecutar su `loader` (el error ya lo anota `onCaughtError` de `main.tsx`). Sin esto, React Router muestra su pantalla genérica
 * en inglés y con la pila a la vista. Un archivo perezoso que no llega (sin
 * señal, o una versión nueva que reemplazó al caché) se arregla recargando.
 */
export function RouteError() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center p-4">
      <EmptyState title="Algo salió mal" description="No se pudo mostrar esta pantalla. Vuelve a cargarla; si sigue igual, avisa al encargado.">
        <Button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
        >
          Recargar
        </Button>
      </EmptyState>
    </main>
  )
}
