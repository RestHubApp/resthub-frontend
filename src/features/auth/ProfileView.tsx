import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { SYSTEM_ADMINISTRATION } from '@/services/systemAdministration'
import { usePreview, useSession } from '@/store/session'
import { AppearanceLink } from './AppearanceLink'
import { ChangePasswordDialog } from './ChangePasswordDialog'

const TERM = 'm-0 text-sm text-muted-foreground'
const DATA = 'm-0 text-base font-medium break-words'

/**
 * La cuenta propia.
 *
 * Los datos se leen pero no se editan aca: el nombre, el correo y el tipo de
 * cuenta los administra el encargado desde Personal. Lo unico propio es la
 * contraseña, que se cambia en una ventana.
 */
export function ProfileView() {
  const account = useSession((state) => state.account)
  const isPreview = usePreview()

  if (account === null) {
    return null
  }

  const isPlatform = account.kind === 'platform'
  // La cuenta de muestra no tiene contraseña y el servidor rechaza cambiarla; la de plataforma no la cambia desde aquí.
  const canChangePassword = !isPreview && !isPlatform
  const data = isPlatform
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

      <AppearanceLink />

    </div>
  )
}
