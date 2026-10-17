import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { useScreenAction } from '@/hooks/useScreenAction'
import { SYSTEM_ADMINISTRATION } from '@/services/systemAdministration'
import { usePreview, useSession } from '@/store/session'
import { AppearanceLink } from './AppearanceLink'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { AccountSecurity } from './security/AccountSecurity'

const TERM = 'm-0 text-sm text-muted-foreground'
const DATA = 'm-0 text-base font-medium break-words'

/**
 * La cuenta propia.
 *
 * Los datos se leen pero no se editan aca: el nombre, el correo y el tipo de
 * cuenta los administra el encargado desde Personal. Lo propio es la
 * contraseña, que se cambia en una ventana, y la seguridad de la cuenta: las
 * sesiones abiertas, la verificación en dos pasos y el PIN de desbloqueo.
 */
export function ProfileView() {
  const account = useSession((state) => state.account)
  const isPreview = usePreview()
  const isPlatform = account?.kind === 'platform'
  // La vista previa y la administración del sistema no cambian contraseña: `?accion=cambiar-contrasena` no aplica y se borra.
  useScreenAction('cambiar-contrasena', { isApplicable: !isPreview && !isPlatform })

  if (account === null) {
    return null
  }

  // La cuenta de muestra no tiene contraseña y el servidor rechaza cambiarla; la de plataforma no la cambia desde aquí.
  const canChangePassword = !isPreview && !isPlatform
  const data = account.kind === 'platform'
    ? [
        { term: 'Nombre', data: account.admin.full_name },
        { term: 'Correo', data: account.admin.email },
        { term: 'Cuenta', data: SYSTEM_ADMINISTRATION },
      ]
    : [
        { term: 'Nombre', data: account.user.full_name },
        { term: 'Correo', data: account.user.email },
        { term: 'Rol', data: account.user.role_label },
        { term: 'Restaurante', data: account.restaurant.name },
      ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mi perfil"
        description={isPlatform ? 'Tus datos los mantiene el equipo de RestHub.' : 'Tus datos los mantiene el encargado del restaurante.'}
      />

      <SectionCard title="Tus datos" actions={canChangePassword ? <ChangePasswordDialog /> : undefined}>
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          {data.map((item) => (
            <div key={item.term} className="flex flex-col gap-0.5">
              <dt className={TERM}>{item.term}</dt>
              <dd className={DATA}>{item.data}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <AccountSecurity account={account} />

      <AppearanceLink />

    </div>
  )
}
