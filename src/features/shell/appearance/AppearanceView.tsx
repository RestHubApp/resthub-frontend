import { BackLink } from '@/components/BackLink'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useAppearance } from '@/store/appearance'
import { FontPicker } from './FontPicker'
import { MenuEditor } from './MenuEditor'
import { TextSizePicker } from './TextSizePicker'
import { ThemePicker } from './ThemePicker'

/**
 * Apariencia: el tema, la letra, el tamaño del texto y el orden del menú.
 *
 * Cada cambio se ve al instante y se guarda solo, para esta cuenta y en este aparato
 * (ver `store/appearance`). No cambia lo que nadie más ve ni lo que la cuenta
 * puede hacer: es solo presentación.
 */
export function AppearanceView() {
  const reset = useAppearance((state) => state.reset)

  return (
    <div className="flex flex-col gap-6">
      <BackLink to={paths.profile} label="Mi perfil" />
      <PageHeader
        title="Apariencia"
        description="Elige cómo se ve RestHub. Lo que cambies se guarda solo, es para tu cuenta y en este aparato: no cambia nada para tus compañeros."
      />

      <SectionCard title="Colores" description="Toca uno para verlo al instante.">
        <ThemePicker />
      </SectionCard>

      <SectionCard title="Letra" description="Escoge la que te resulte más cómoda de leer.">
        <FontPicker />
      </SectionCard>

      <SectionCard title="Tamaño del texto" description="Agranda todo el texto y los botones.">
        <TextSizePicker />
      </SectionCard>

      <SectionCard
        title="Menú"
        description="Pon primero lo que más usas y elige las cuatro pantallas de la barra de abajo del celular. Solo cambia el orden: no da ni quita permisos."
      >
        <MenuEditor />
      </SectionCard>

      <div>
        <Button type="button" variant="outline" onClick={reset}>
          Volver a todo lo de siempre
        </Button>
      </div>
    </div>
  )
}
