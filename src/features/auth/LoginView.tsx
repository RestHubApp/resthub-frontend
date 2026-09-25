import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { login } from '../../api/auth'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { correoRule } from '../../services/fieldRules'
import { useSession } from '../../store/session'
import AuthAside from './AuthAside'
import AuthCard from './AuthCard'
import SessionExpiredNotice from './SessionExpiredNotice'

const esquema = z.object({
  email: correoRule,
  // Al entrar no se exige la longitud: la respuesta del servidor ya dice si
  // la contrasena no coincide, y repetir aca la regla no agrega nada.
  password: z.string().min(1, 'Escribe tu contraseña'),
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
    onSuccess: ({ access_token: token, user, restaurant, permissions }) => {
      signIn(token, { user, restaurant, permissions })
      void navigate(destino, { replace: true })
    },
  })

  return (
    <AuthCard title="Iniciar sesión" aside={PANEL}>
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
