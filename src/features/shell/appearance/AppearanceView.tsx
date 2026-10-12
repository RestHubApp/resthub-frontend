import { BackLink } from '@/components/BackLink'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { paths } from '@/services/paths'
import { useAppearance } from '@/store/appearance'
import { AppearancePreview } from './AppearancePreview'
import { MenuEditor } from './MenuEditor'
import { ReadingTab } from './ReadingTab'
import { ScreenTab } from './ScreenTab'

const TAB = 'min-h-10 flex-1 text-base'

/**
 * Apariencia, en tres pestañas: «Pantalla» (modo, color y alto contraste),
 * «Lectura» (tamaño del texto, letra y densidad) y «Menú» (orden y barra de
 * abajo), con una vista previa fija arriba.
 *
 * Cada cambio se ve al instante y se guarda solo, para esta cuenta y en este
 * celular o computadora (ver `store/appearance`). No cambia lo que nadie más ve ni
 * lo que la cuenta puede hacer: es solo presentación.
 */
export function AppearanceView() {
  const reset = useAppearance((state) => state.reset)

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={paths.profile} label="Mi perfil" />
      <PageHeader
        title="Apariencia"
        description="Se guarda solo, para tu cuenta y en este celular o computadora. No cambia nada para tus compañeros."
      />
      <AppearancePreview />
      <Tabs defaultValue="screen" className="gap-4">
        <TabsList className="h-auto w-full">
          <TabsTrigger value="screen" className={TAB}>
            Pantalla
          </TabsTrigger>
          <TabsTrigger value="reading" className={TAB}>
            Lectura
          </TabsTrigger>
          <TabsTrigger value="menu" className={TAB}>
            Menú
          </TabsTrigger>
        </TabsList>
        <TabsContent value="screen">
          <ScreenTab />
        </TabsContent>
        <TabsContent value="reading">
          <ReadingTab />
        </TabsContent>
        <TabsContent value="menu">
          <MenuEditor />
        </TabsContent>
      </Tabs>
      <div>
        <Button type="button" variant="outline" onClick={reset}>
          Restablecer apariencia
        </Button>
      </div>
    </div>
  )
}
