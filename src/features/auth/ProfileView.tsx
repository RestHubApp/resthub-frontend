import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { useSession } from '../../store/session'
import ChangePasswordForm from './ChangePasswordForm'

const TERMINO = 'm-0 text-sm text-muted-foreground'
const DATO = 'm-0 text-base font-medium break-words'

/**
 * La cuenta propia.
 *
 * Los datos se leen pero no se editan aca: el nombre, el correo y el tipo de
 * cuenta los administra el encargado desde Personal. Lo unico propio es la
 * contraseña.
 */
export default function ProfileView() {
  const account = useSession((state) => state.account)

  if (account === null) {
    return null
  }

  const datos = [
    { termino: 'Nombre', dato: account.user.full_name },
    { termino: 'Correo', dato: account.user.email },
    { termino: 'Tipo de cuenta', dato: account.user.role_label },
    { termino: 'Restaurante', dato: account.restaurant.name },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi perfil" description="Tus datos los mantiene el encargado del restaurante." />

      <SectionCard title="Tus datos">
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          {datos.map((item) => (
            <div key={item.termino} className="flex flex-col gap-0.5">
              <dt className={TERMINO}>{item.termino}</dt>
              <dd className={DATO}>{item.dato}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Cambiar contraseña">
        <ChangePasswordForm />
      </SectionCard>
    </div>
  )
}
