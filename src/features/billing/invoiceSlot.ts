import type { ComponentType } from 'react'

import type { Invoice } from '@/api/types'

/**
 * Lo que se agrega debajo de cada comprobante del listado: la anulación y el
 * cambio por otro, que comparten el formulario de emisión de los pedidos. El
 * router lo entrega, porque una característica no importa a otra.
 */
export type InvoiceSlot = ComponentType<{ readonly invoice: Invoice }>
