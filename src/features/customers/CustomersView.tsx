import { useState } from 'react'

import type { Customer } from '../../api/types'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button } from '../../components/ui/button'
import { useCan } from '../../store/session'
import CustomerDialog from './CustomerDialog'
import CustomerList from './CustomerList'
import CustomerSheet from './CustomerSheet'

type Editing = { readonly customer: Customer | null } | null

/**
 * La libreta de clientes: quién viene seguido, cuánto gasta y a dónde se le lleva.
 *
 * Los pedidos de delivery agregan al cliente solos por su teléfono; acá se
 * busca, se corrigen datos y se anotan preferencias.
 */
export default function CustomersView() {
  const puedeEditar = useCan('customers.manage')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [editando, setEditando] = useState<Editing>(null)
  const nuevo = (
    <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
      setEditando({ customer: null })
    }}>
      <Icon name="agregar" size={18} />
      <span>Nuevo cliente</span>
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Los clientes del local, sus visitas y lo que gastan. Frecuente es quien vino tres veces o más."
        actions={puedeEditar ? nuevo : undefined}
      />
      <CustomerList onOpen={setAbierto} />
      <CustomerSheet
        customerId={abierto}
        canEdit={puedeEditar}
        onClose={() => {
          setAbierto(null)
        }}
        onEdit={(customer) => {
          setAbierto(null)
          setEditando({ customer })
        }}
      />
      <CustomerDialog open={editando !== null} customer={editando?.customer ?? null} onClose={() => {
        setEditando(null)
      }} />
    </div>
  )
}
