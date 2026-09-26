import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { login, sessionOf } from '../../api/auth'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { correoRule, MAX_PASSWORD } from '../../services/fieldRules'
import { isPreviewTab } from '../../services/tabStorage'
import { useSession } from '../../store/session'
import AuthAside from './AuthAside'
import AuthCard from './AuthCard'
import SessionExpiredNotice from './SessionExpiredNotice'

const esquema = z.object({
  email: correoRule,
  // Al entrar no se exige el minimo: la respuesta del servidor ya dice si
  // la contrasena no coincide, y repetir aca la regla no agrega nada. El
  // maximo si, porque el servidor rechaza una mas larga antes de mirarla.
  password: z
    .string()
    .min(1, 'Escribe tu contraseña')
    .max(MAX_PASSWORD, `Usa como máximo ${String(MAX_PASSWORD)} caracteres`),
})

type Formulario = z.infer<typeof esquema>

const PANEL = (
  <AuthAside
    title="Tu restaurante, sin libreta"
    items={[
      { icon: 'pedido', text: 'Toma los pedidos desde el celular, mesa por mesa o para llevar.' },
      { icon: 'tablero', text: 'La cocina ve qué preparar y la caja sabe qué cobrar.' },
      { icon: 'indicadores', text: 'Ventas, inventario y lo que más se pide, al día.' },
    ]}
    note="Tu cuenta la crea el encargado del restaurante. Si olvidaste tu contraseña, pídele que la restablezca."
  />
)

// Discreto a propósito: es la puerta del equipo de RestHub, no la del
// personal, y lleva a otra sesión que no toca la de este acceso.
const PLATAFORMA = (
  <Link
    to="/plataforma/acceso"
    className="inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    Administración del sistema
  </Link>
)

/**
 * A dónde ir después de entrar.
 *
 * La guarda de rutas deja la pantalla que se quiso abrir: quien vuelve tras una
 * sesión vencida sigue donde estaba en vez de empezar desde el inicio.
 */
function destinoDe(estado: unknown): string {
  const desde =
    typeof estado === 'object' && estado !== null && 'from' in estado ? estado.from : undefined
  return typeof desde === 'string' && desde.startsWith('/') && desde !== '/acceso' ? desde : '/'
}

export default function LoginView() {
  const signIn = useSession((state) => state.signIn)
  const navigate = useNavigate()
  const destino = destinoDe(useLocation().state)
  const { register, handleSubmit, formState } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const acceder = useMutation({
    mutationFn: login,
    // La respuesta ya trae la cuenta, el restaurante y los permisos: la sesion
    // se abre sin pedir `/auth/me` aparte.
    onSuccess: (respuesta) => {
      signIn(respuesta.access_token, sessionOf(respuesta))
      void navigate(destino, { replace: true })
    },
  })

  // Una pestaña de vista previa no es para entrar con una cuenta real: su
  // sesion se guardaria en la pestaña, no en el navegador.
  if (isPreviewTab()) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthCard title="Iniciar sesión" aside={PANEL} footer={PLATAFORMA}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((valores) => {
            acceder.mutate(valores)
          }),
        )}
      >
        <SessionExpiredNotice />
        <TextField
          id="email"
          label="Correo"
          placeholder="nombre@correo.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          field={register('email')}
          error={formState.errors.email?.message}
        />

        <PasswordField
          id="password"
          label="Contraseña"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          field={register('password')}
          error={formState.errors.password?.message}
        />

        {acceder.isError ? (
          <FormMessage tone="error">
            {errorMessage(acceder.error, 'No se pudo iniciar sesión. Inténtalo de nuevo.')}
          </FormMessage>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={acceder.isPending}>
          <Icon name="entrar" size={18} />
          <span>{acceder.isPending ? 'Entrando…' : 'Entrar'}</span>
        </Button>
      </form>
    </AuthCard>
  )
}
