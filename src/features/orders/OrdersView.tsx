import { useSearchParams } from 'react-router'

import PageHeader from '../../components/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import MyOrdersPanel from './floor/MyOrdersPanel'
import TableGrid from './floor/TableGrid'
import TakeawayDialog from './floor/TakeawayDialog'
import TakeawayPanel from './floor/TakeawayPanel'
import LiveIndicator from './LiveIndicator'
import { useLiveUpdates } from './useLiveUpdates'

const VISTAS = ['mesas', 'llevar', 'mios'] as const
type Vista = (typeof VISTAS)[number]

function vistaDe(valor: string | null): Vista {
  return VISTAS.find((vista) => vista === valor) ?? 'mesas'
}

const TRIGGER = 'min-h-10 text-sm data-active:font-semibold'

/**
 * La pantalla del mesero: el salon, lo que sale para llevar y lo suyo.
 *
 * La pestana va en la URL para que volver atras desde un pedido deje al
 * mesero donde estaba. La pantalla se actualiza sola con los avisos del servidor.
 */
export default function OrdersView() {
  const live = useLiveUpdates()
  const [params, setParams] = useSearchParams()
  const vista = vistaDe(params.get('vista'))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pedidos"
        description="Toca una mesa libre para tomar el pedido, u ocupada para verlo."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <TakeawayDialog />
            <LiveIndicator status={live} />
          </div>
        }
      />
      <Tabs
        value={vista}
        onValueChange={(valor) => {
          setParams({ vista: valor }, { replace: true })
        }}
        className="gap-4"
      >
        <TabsList className="h-12 w-full sm:w-fit">
          <TabsTrigger value="mesas" className={TRIGGER}>Mesas</TabsTrigger>
          <TabsTrigger value="llevar" className={TRIGGER}>Para llevar</TabsTrigger>
          <TabsTrigger value="mios" className={TRIGGER}>Mis pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="mesas">
          <TableGrid />
        </TabsContent>
        <TabsContent value="llevar">
          <TakeawayPanel />
        </TabsContent>
        <TabsContent value="mios">
          <MyOrdersPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
