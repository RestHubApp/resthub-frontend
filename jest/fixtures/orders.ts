// Datos de pedidos, mesas, carta y clientes para las pruebas, con la forma del API.
import type {
  Customer,
  OrderMenu,
  OrderMenuItem,
  OrderMenuSection,
  OrderNoteClassification,
  OrderResponse,
  TableState,
} from '../../src/api/types'

type Item = OrderResponse['items'][number]
type Summary = NonNullable<TableState['active_order']>

const CREATED = '2026-09-26T17:00:00Z'
const LOMO = 'Lomo saltado'

export function orderItem(changes: Partial<Item> = {}): Item {
  return {
    id: 101,
    menu_item_id: 11,
    name: LOMO,
    quantity: 1,
    unit_price: '32.00',
    subtotal: '32.00',
    notes: '',
    modifiers: [],
    is_courtesy: false,
    courtesy_reason: '',
    is_paid: false,
    kitchen_round: 1,
    voided_at: null,
    void_reason: null,
    created_at: CREATED,
    ...changes,
  }
}

export function order(changes: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 5,
    number: 12,
    type: 'dine_in',
    type_label: 'En mesa',
    status: 'in_kitchen',
    status_label: 'En cocina',
    table_id: 3,
    table_label: '3',
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_reference: '',
    notes: '',
    items: [orderItem()],
    item_count: 1,
    subtotal: '32.00',
    total: '32.00',
    balance: '32.00',
    paid_amount: '0.00',
    tips: '0.00',
    courtesy_amount: '0.00',
    discount_amount: '0.00',
    discount_percent: '0',
    discount_reason: '',
    discounted_by_name: null,
    amount_received: null,
    change: null,
    payment_method: null,
    payment_method_label: null,
    payments: [],
    voided_payments: [],
    merged_into_id: null,
    kitchen_round: 1,
    cancel_reason: '',
    cancelled_at: null,
    paid_at: null,
    business_date: '2026-09-26',
    created_at: CREATED,
    updated_at: CREATED,
    status_changed_at: CREATED,
    waiter_id: 7,
    waiter_name: 'Ana Torres',
    ...changes,
  }
}

export function activeSummary(changes: Partial<Summary> = {}): Summary {
  return {
    id: 5,
    number: 12,
    status: 'in_kitchen',
    status_label: 'En cocina',
    item_count: 2,
    total: '64.00',
    balance: '64.00',
    waiter_id: 7,
    waiter_name: 'Ana Torres',
    created_at: CREATED,
    updated_at: CREATED,
    status_changed_at: CREATED,
    ...changes,
  }
}

export function table(changes: Partial<TableState> = {}): TableState {
  return {
    id: 3,
    label: '3',
    position: 1,
    is_active: true,
    status: 'free',
    status_label: 'Libre',
    active_order: null,
    created_at: CREATED,
    ...changes,
  }
}

export function dish(changes: Partial<OrderMenuItem> = {}): OrderMenuItem {
  return {
    id: 11,
    category_id: 1,
    name: LOMO,
    description: '',
    price: '32.00',
    position: 1,
    is_active: true,
    is_available: true,
    out_of_stock: false,
    modifier_groups: [],
    created_at: CREATED,
    ...changes,
  }
}

export function section(changes: Partial<OrderMenuSection> = {}): OrderMenuSection {
  return { id: 1, name: 'Fondos', position: 1, is_active: true, items: [dish()], created_at: CREATED, ...changes }
}

/** Una carta con fondos, bebidas (con opciones en la chicha) y un plato agotado. */
export function buildMenu(): OrderMenu {
  return {
    categories: [
      section({
        items: [
          dish(),
          dish({ id: 12, name: 'Ají de gallina', price: '28.00', position: 2 }),
          dish({ id: 13, name: 'Seco de cabrito', price: '35.00', position: 3, is_available: false }),
        ],
      }),
      section({
        id: 2,
        name: 'Bebidas',
        position: 2,
        items: [
          dish({
            id: 21,
            category_id: 2,
            name: 'Chicha morada',
            price: '8.00',
            modifier_groups: [
              {
                name: 'Tamaño',
                min_choices: 1,
                max_choices: 1,
                options: [
                  { name: 'Vaso', price: '0.00' },
                  { name: 'Jarra', price: '12.00' },
                ],
              },
              {
                name: 'Extras',
                min_choices: 0,
                max_choices: 2,
                options: [
                  { name: 'Hielo', price: '0.00' },
                  { name: 'Limón', price: '0.50' },
                ],
              },
            ],
          }),
        ],
      }),
    ],
  }
}

export function customer(changes: Partial<Customer> = {}): Customer {
  return {
    id: 40,
    name: 'Rosa Quispe',
    phone: '987654321',
    email: '',
    address: 'Jr. Cusco 120',
    reference: 'Frente al parque',
    notes: '',
    is_frequent: true,
    masked: false,
    visits: 4,
    spent: '240.00',
    average_ticket: '60.00',
    last_visit: CREATED,
    recent_orders: [],
    created_at: CREATED,
    consent_at: CREATED,
    consent_version: '2026-10',
    ...changes,
  }
}

/** La lectura de la IA de una nota que menciona una alergia. */
export function noteWithAllergy(changes: Partial<OrderNoteClassification> = {}): OrderNoteClassification {
  return {
    order_id: 5,
    order_item_id: 101,
    scope: 'item',
    status: 'classified',
    note: 'alérgico al maní',
    dish_name: LOMO,
    mentions_allergy: true,
    allergy_probability: 0.93,
    confidence: 0.9,
    engine: 'jev',
    note_type: 'allergy',
    note_type_label: 'Alergia',
    decided_at: CREATED,
    ...changes,
  }
}

/** El cuerpo de la última petición con ese método y esa ruta. */
export function lastBody(requests: readonly { readonly body: unknown }[]): unknown {
  return requests.at(-1)?.body
}
