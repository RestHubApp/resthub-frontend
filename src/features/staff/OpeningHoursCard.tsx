import { PERMISSION } from '@/api/permissions'
import { SectionCard } from '@/components/SectionCard'
import { useCan } from '@/store/session'
import { OpeningHoursForm } from './OpeningHoursForm'

/** El horario de atención, para quien administra el restaurante: con él se marcan los accesos fuera de horario (RFS-32). */
export function OpeningHoursCard() {
  const canManage = useCan(PERMISSION.restaurantManage)
  if (!canManage) return null
  return (
    <SectionCard
      title="Horario de atención"
      description="En la hora del local. Si un tramo cierra antes de abrir, cierra de madrugada del día siguiente. Los accesos fuera de este horario se marcan en el historial."
    >
      <OpeningHoursForm />
    </SectionCard>
  )
}
