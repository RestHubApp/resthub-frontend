import { PERMISSION } from '@/api/permissions'
import { SectionCard } from '@/components/SectionCard'
import { useCan } from '@/store/session'
import { IdleLockForm } from './IdleLockForm'

/** El bloqueo por inactividad del local, para quien administra el restaurante. */
export function IdleLockCard() {
  const canManage = useCan(PERMISSION.restaurantManage)
  if (!canManage) return null
  return (
    <SectionCard
      title="Bloqueo por inactividad"
      description="Si nadie usa la pantalla por estos minutos, la sesión se bloquea y se abre con el PIN o la contraseña de cada persona."
    >
      <IdleLockForm />
    </SectionCard>
  )
}
