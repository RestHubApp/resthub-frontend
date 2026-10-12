import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { billingSettingsQuery } from '@/api/billing'
import { DetailSheet } from '@/components/DetailSheet'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { useScreenAction } from '@/hooks/useScreenAction'
import { BillingSettingsForm } from './BillingSettingsForm'
import { FiscalDataButton } from './FiscalDataButton'
import { InvoiceList } from './InvoiceList'

/**
 * Comprobantes electrónicos: lo emitido y, en una hoja, los datos fiscales.
 *
 * Un comprobante rechazado o sin enviar se reenvía desde acá, por ejemplo
 * después de cargar el token del proveedor. Los datos fiscales se llenan una
 * vez, así que no ocupan la pantalla: el botón de la cabecera los abre y lleva
 * «Falta completar» mientras falte algo para enviar a SUNAT.
 */
export function BillingView() {
  const settings = useQuery(billingSettingsQuery)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const fiscal = useScreenAction('datos-fiscales')
  const open = () => {
    setIsSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comprobantes"
        description="Boletas y facturas electrónicas enviadas a SUNAT por el proveedor autorizado."
        actions={
          settings.data === undefined ? undefined : <FiscalDataButton isIncomplete={!settings.data.is_ready} onClick={open} />
        }
      />
      {/* «Emitidos» espera a los datos fiscales para no moverse al llegar (CLS). */}
      {settings.isPending ? (
        <ListSkeleton label="Cargando comprobantes…" count={4} itemClassName="h-14 rounded-lg" />
      ) : (
        <SectionCard title="Emitidos">
          <InvoiceList />
        </SectionCard>
      )}
      {settings.data ? (
        <DetailSheet
          open={isSheetOpen || fiscal.isRequested}
          onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen)
            if (!isOpen) {
              fiscal.clear()
            }
          }}
          title="Datos fiscales"
          description="El RUC, las series y la conexión con el proveedor. Se llenan una vez."
        >
          <BillingSettingsForm
            settings={settings.data}
            onSaved={() => {
              setIsSheetOpen(false)
              fiscal.clear()
            }}
          />
        </DetailSheet>
      ) : null}
    </div>
  )
}
