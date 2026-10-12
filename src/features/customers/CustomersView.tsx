import { useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import type { Customer } from '@/api/types'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { CustomerDialog } from './CustomerDialog'
import { CustomerList } from './CustomerList'
import { CustomerSheet } from './CustomerSheet'

type Editing = { readonly customer: Customer | null } | null

/**
 * La libreta de clientes: quién viene seguido, cuánto gasta y a dónde se le lleva.
 *
 * Los pedidos de delivery agregan al cliente solos por su teléfono; acá se
 * busca, se corrigen datos y se anotan preferencias.
 */
export function CustomersView() {
  const canEdit = useCan(PERMISSION.customersManage)
  const [open, openSet] = useState<number | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const fresh = (
    <Button type="button" onClick={() => {
      setEditing({ customer: null })
    }}>
      <Icon name="add" size={18} />
      <span>Nuevo cliente</span>
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Los clientes del local, sus visitas y lo que gastan. Frecuente es quien vino tres veces o más."
        actions={canEdit ? fresh : undefined}
      />
      <CustomerList onOpen={openSet} />
      <CustomerSheet
        customerId={open}
        canEdit={canEdit}
        onClose={() => {
          openSet(null)
        }}
        onEdit={(customer) => {
          openSet(null)
          setEditing({ customer })
        }}
      />
      <CustomerDialog open={editing !== null} customer={editing?.customer ?? null} onClose={() => {
        setEditing(null)
      }} />
    </div>
  )
}
