import { reportSignOut } from '@/api/auth'
import type { StaffSession } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSession } from '@/store/session'
import { ChangePasswordForm } from './ChangePasswordForm'

/**
 * La contraseña temporal (RFS-20): una cuenta creada o restablecida por otra
 * persona entra con una contraseña que esa persona conoce. Hasta cambiarla, el
 * servidor no deja hacer nada más; la pantalla tapa el armazón entero y solo
 * deja cambiarla o salir.
 */
export function TemporaryPasswordView({ account }: { readonly account: StaffSession }) {
  const signOut = () => {
    // Salir cierra también la sesión de este dispositivo en el servidor.
    const { token } = useSession.getState()
    if (typeof token === 'string') void reportSignOut(token)
    useSession.getState().signOut()
  }

  return (
    <main id="contenido" className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md gap-5 py-6">
        <CardHeader className="gap-2 px-6">
          <h1 className="m-0 font-heading text-2xl font-bold">Cambia tu contraseña</h1>
          <p className="m-0 text-muted-foreground">
            {`${account.user.full_name}, entraste con una contraseña temporal que te dio otra persona. Elige una tuya para seguir: solo tú debes conocerla.`}
          </p>
        </CardHeader>
        <CardContent className="px-6">
          <ChangePasswordForm />
        </CardContent>
        <CardFooter className="flex justify-end px-6">
          <Button type="button" variant="outline" onClick={signOut}>
            Salir
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
