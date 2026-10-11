// Pedidos, platos, pagos, mesas y comprobantes con la forma del API, para las
// pruebas del detalle del pedido, el cobro, el tablero y el historial.
import type {
  Invoice,
  OrderItemResponse,
  OrderResponse,
  PaymentResponse,
  TableState,
} from '../../src/api/types'

const CREATED = '2026-09-26T17:00:00Z'

export function dish(changes: Partial<OrderItemResponse> = {}): OrderItemResponse {
  return {
    id: 1,
    menu_item_id: 10,
    name: 'Lomo saltado',
    quantity: 1,
    unit_price: '30.00',
    subtotal: '30.00',
    notes: '',
    modifiers: [],
    is_courtesy: false,
    courtesy_reason: '',
    is_paid: false,
    created_at: CREATED,
    ...changes,
  }
}

export function payment(changes: Partial<PaymentResponse> = {}): PaymentResponse {
  return {
    id: 50,
    amount: '30.00',
    amount_received: null,
    change: null,
    created_at: CREATED,
    item_ids: [],
    method: 'yape',
    method_label: 'Yape',
    received_by: 7,
    received_by_name: 'Ana Torres',
    tip: '0.00',
    ...changes,
  }
}

/** Un pedido en mesa servido y por cobrar: dos platos de S/ 30 y S/ 20. */
export function handleOrder(changes: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 12,
    number: 34,
    type: 'dine_in',
    type_label: 'En mesa',
    status: 'served',
    status_label: 'Servido, por cobrar',
    table_id: 3,
    table_label: '3',
    waiter_id: 7,
    waiter_name: 'Ana Torres',
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_reference: '',
    notes: '',
    items: [dish(), dish({ id: 2, menu_item_id: 11, name: 'Chicha morada', unit_price: '20.00', subtotal: '20.00' })],
    item_count: 2,
    subtotal: '50.00',
    courtesy_amount: '0.00',
    discount_amount: '0.00',
    discount_percent: '0.00',
    discount_reason: '',
    discounted_by_name: null,
    total: '50.00',
    paid_amount: '0.00',
    balance: '50.00',
    tips: '0.00',
    payments: [],
    payment_method: null,
    payment_method_label: null,
    amount_received: null,
    change: null,
    paid_at: null,
    cancelled_at: null,
    cancel_reason: '',
    merged_into_id: null,
    business_date: '2026-09-26',
    created_at: CREATED,
    updated_at: CREATED,
    status_changed_at: CREATED,
    ...changes,
  }
}

/** El pedido después de cobrarse entero con ese pago. */
export function paid(base: OrderResponse, last: PaymentResponse): OrderResponse {
  return {
    ...base,
    status: 'paid',
    status_label: 'Pagado',
    payments: [...base.payments, last],
    paid_amount: base.total,
    balance: '0.00',
    payment_method: last.method,
    payment_method_label: last.method_label,
    amount_received: last.amount_received,
    change: last.change,
    paid_at: CREATED,
  }
}

export function table(changes: Partial<TableState> = {}): TableState {
  return {
    id: 4,
    label: '4',
    position: 4,
    is_active: true,
    status: 'free',
    status_label: 'Libre',
    active_order: null,
    created_at: CREATED,
    ...changes,
  }
}

export function invoice(changes: Partial<Invoice> = {}): Invoice {
  return {
    id: 90,
    order_id: 12,
    kind: 'boleta',
    kind_label: 'Boleta',
    series: 'B001',
    number: 15,
    code: 'B001-15',
    status: 'accepted',
    status_label: 'Aceptada por SUNAT',
    customer_document_type: 'none',
    customer_document_number: '',
    customer_name: '',
    customer_address: '',
    taxable: '42.37',
    igv: '7.63',
    igv_rate: '18.00',
    discount: '0.00',
    total: '50.00',
    lines: [],
    pdf_url: '',
    provider_message: '',
    issued_at: CREATED,
    ...changes,
  }
}
