import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { usePreview, useSession } from '@/store/session'
import { ChangePasswordForm } from './ChangePasswordForm'

const TERM = 'm-0 text-sm text-muted-foreground'
const DATA = 'm-0 text-base font-medium break-words'

/**
 * La cuenta propia.
 *
 * Los datos se leen pero no se editan aca: el nombre, el correo y el tipo de
 * cuenta los administra el encargado desde Personal. Lo unico propio es la
 * contraseña.
 */
export function ProfileView() {
  const account = useSession((state) => state.account)
  const isPreview = usePreview()

  if (account === null) {
    return null
  }

  const data = [
    { term: 'Nombre', data: account.user.full_name },
    { term: 'Correo', data: account.user.email },
    { term: 'Rol', data: account.user.role_label },
    { term: 'Restaurante', data: account.restaurant.name },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi perfil" description="Tus datos los mantiene el encargado del restaurante." />

      <SectionCard title="Tus datos">
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          {data.map((item) => (
            <div key={item.term} className="flex flex-col gap-0.5">
              <dt className={TERM}>{item.term}</dt>
              <dd className={DATA}>{item.data}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {/* La cuenta de muestra no tiene contraseña y el servidor rechaza cambiarla. */}
      {isPreview ? null : (
        <SectionCard title="Cambiar contraseña">
          <ChangePasswordForm />
        </SectionCard>
      )}
    </div>
  )
}
