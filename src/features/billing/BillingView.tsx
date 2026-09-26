import { useQuery } from '@tanstack/react-query'

import { billingSettingsQuery } from '../../api/billing'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import BillingSettingsForm from './BillingSettingsForm'
import InvoiceList from './InvoiceList'

/**
 * Comprobantes electrónicos: los datos fiscales del local y lo emitido.
 *
 * Un comprobante rechazado o sin enviar se reenvía desde acá, por ejemplo
 * después de cargar el token del proveedor. Los datos fiscales se abren solos
 * mientras falte algo para enviar a SUNAT.
 */
export default function BillingView() {
  const ajustes = useQuery(billingSettingsQuery)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Comprobantes" description="Boletas y facturas electrónicas enviadas a SUNAT por el proveedor autorizado." />
      {ajustes.data ? (
        <SectionCard title="Datos fiscales" collapsible defaultOpen={!ajustes.data.is_ready}>
          <BillingSettingsForm settings={ajustes.data} />
        </SectionCard>
      ) : null}
      <SectionCard title="Emitidos">
        <InvoiceList />
      </SectionCard>
    </div>
  )
}
