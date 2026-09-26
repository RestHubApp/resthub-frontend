import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useSession } from '../../store/session'
import { leavePreview } from './leavePreview'

/**
 * Lo que queda en una pestaña de vista previa cuando su sesión terminó.
 *
 * No ofrece el acceso normal: esta pestaña no es para entrar con una cuenta
 * real. Una vista previa vencida se vuelve a abrir desde la administración.
 */
export default function PreviewEndedView() {
  const expired = useSession((state) => state.expired)

  return (
    <main id="contenido" tabIndex={-1} className="flex min-h-dvh flex-col justify-center bg-background px-4 py-6 outline-none sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <EmptyState
          title={expired ? 'La vista previa venció' : 'Saliste de la vista previa'}
          description={
            expired
              ? 'Duraba 30 minutos y no se renueva. Abre otra desde «Vista previa» en la administración del sistema.'
              : 'Esta pestaña ya no tiene sesión. Puedes cerrarla.'
          }
        >
          <Button type="button" size="lg" className="h-11 px-4" onClick={leavePreview}>
            <Icon name="salir" size={18} />
            <span>Cerrar la vista previa</span>
          </Button>
        </EmptyState>
      </div>
    </main>
  )
}
