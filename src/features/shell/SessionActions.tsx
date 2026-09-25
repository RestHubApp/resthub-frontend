import { Link, useNavigate } from 'react-router'

import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useSession } from '../../store/session'

interface SessionActionsProps {
  readonly fullName: string
  readonly roleLabel: string
  readonly onNavigate?: () => void
}

/** El perfil propio y la salida, al pie de la barra lateral y del panel "Más". */
export default function SessionActions({ fullName, roleLabel, onNavigate }: SessionActionsProps) {
  const signOut = useSession((state) => state.signOut)
  const navigate = useNavigate()

  const cerrarSesion = () => {
    onNavigate?.()
    // Se vacia la sesion y se va al acceso en el mismo evento: React aplica
    // los dos cambios juntos, asi que ninguna pantalla privada llega a
    // dibujarse sin cuenta.
    signOut()
    void navigate('/acceso', { replace: true })
  }

  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <Button asChild variant="ghost" className="h-auto min-h-11 justify-start gap-3 px-3 py-2">
        <Link to="/perfil" onClick={onNavigate}>
          <Icon name="perfil" size={18} />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="max-w-full truncate">{fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </span>
        </Link>
      </Button>
      <Button type="button" variant="ghost" className="h-11 justify-start gap-3 px-3" onClick={cerrarSesion}>
        <Icon name="salir" size={18} />
        <span>Cerrar sesión</span>
      </Button>
    </div>
  )
}
