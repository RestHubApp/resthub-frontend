import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { billingSettingsQuery } from '@/api/billing'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { useScreenAction } from '@/hooks/useScreenAction'
import { FiscalDataButton } from './FiscalDataButton'
import { FiscalDataSheet } from './FiscalDataSheet'
import { InvoiceList } from './InvoiceList'

/**
 * Comprobantes electrónicos: lo emitido y, en una hoja, los datos fiscales.
 *
 * Un comprobante rechazado o sin enviar se reenvía desde acá, por ejemplo
 * después de cargar las credenciales SOL o el certificado. Los datos fiscales
 * se llenan una vez, así que no ocupan la pantalla: el botón de la cabecera los
 * abre y lleva «Falta completar» mientras falte algo para enviar a SUNAT.
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
        description="Boletas y facturas electrónicas firmadas con el certificado del local y enviadas a SUNAT."
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
        <FiscalDataSheet
          settings={settings.data}
          open={isSheetOpen || fiscal.isRequested}
          onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen)
            if (!isOpen) {
              fiscal.clear()
            }
          }}
          onSaved={() => {
            setIsSheetOpen(false)
            fiscal.clear()
          }}
        />
      ) : null}
    </div>
  )
}
