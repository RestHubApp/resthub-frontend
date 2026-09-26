import { useQuery } from '@tanstack/react-query'

import { platformSandboxQuery } from '../../api/platform'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import PlatformQueryError from './PlatformQueryError'
import PreviewLauncher from './PreviewLauncher'
import SandboxResetButton from './SandboxResetButton'
import SandboxSummary from './SandboxSummary'

/**
 * «Vista previa»: RestHub como lo ve un encargado o un mesero, para depurar.
 *
 * Solo entra al local de muestra, con datos ficticios; no hay forma de mirar
 * un restaurante real desde acá. La vista previa se usa de verdad (tomar
 * pedidos, cobrar, encolar sin señal) y el local se reinicia cuando haga falta.
 */
export default function PreviewView() {
  const muestra = useQuery(platformSandboxQuery)

  let resumen = <ListSkeleton label="Cargando el local de muestra…" count={2} itemClassName="h-16 rounded-xl" />
  if (muestra.isError) {
    resumen = (
      <PlatformQueryError error={muestra.error} fallback="No se pudo cargar el local de muestra." onRetry={() => void muestra.refetch()} />
    )
  } else if (muestra.isSuccess) {
    resumen = <SandboxSummary sandbox={muestra.data} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vista previa"
        description="RestHub tal como lo ve un encargado o un mesero, en un local de muestra con datos ficticios. Ningún restaurante real se toca."
      />
      <SectionCard title="Local de muestra">{resumen}</SectionCard>
      <SectionCard
        title="Abrir la vista previa"
        description="Se abre en otra pestaña con una sesión de 30 minutos que no se renueva y vive solo en esa pestaña: no cierra ni reemplaza ninguna otra sesión de este navegador."
      >
        <PreviewLauncher />
      </SectionCard>
      <SectionCard title="Reiniciar" description="Archiva el local de muestra actual y crea uno nuevo con los datos de siempre.">
        <SandboxResetButton exists={(muestra.data?.restaurant ?? null) !== null} />
      </SectionCard>
    </div>
  )
}
