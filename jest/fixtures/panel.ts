// Datos de comprobantes, clientes, reservas y panel para las pruebas, con la forma del API.
import type {
  BillingSettings,
  Customer,
  DishMargin,
  HourlyCell,
  Invoice,
  Reservation,
  SalesSummary,
  TableState,
  WasteReport,
} from '../../src/api/types'

export function taxSettings(changes: Partial<BillingSettings> = {}): BillingSettings {
  return {
    ruc: '20123456789',
    legal_name: 'La Picantería S.A.C.',
    address: 'Av. Larco 123, Miraflores',
    igv_rate: '18.00',
    boleta_series: 'B001',
    factura_series: 'F001',
    boleta_credit_note_series: 'BC01',
    factura_credit_note_series: 'FC01',
    has_sol_credentials: true,
    has_certificate: true,
    certificate_expires_at: '2027-09-30T05:00:00Z',
    is_ready: true,
    ...changes,
  }
}

export function invoice(changes: Partial<Invoice> = {}): Invoice {
  return {
    credit_note: null,
    credit_note_id: null,
    replaces_invoice_id: null,
    is_voided: false,
    voided_at: null,
    void_reason: '',
    id: 5,
    order_id: 40,
    kind: 'boleta',
    kind_label: 'Boleta',
    series: 'B001',
    number: 12,
    code: 'B001-12',
    status: 'accepted',
    status_label: 'Aceptado por SUNAT',
    provider_message: '',
    has_pdf: true,
    has_xml: true,
    has_cdr: true,
    archive_status: 'disabled',
    archive_status_label: 'Respaldo apagado',
    archive_message: '',
    archived_at: null,
    issued_at: '2026-09-26T17:30:00Z',
    customer_name: 'Clientes varios',
    customer_document_type: 'none',
    customer_document_number: '',
    customer_address: '',
    discount: '0.00',
    taxable: '50.85',
    igv: '9.15',
    igv_rate: '18.00',
    total: '60.00',
    lines: [{ description: 'Ceviche', quantity: 2, unit_price: '30.00', total: '60.00', is_courtesy: false }],
    ...changes,
  }
}

export function customer(changes: Partial<Customer> = {}): Customer {
  return {
    id: 11,
    name: 'Rosa Quispe',
    phone: '987654321',
    email: '',
    address: 'Jr. Unión 450',
    reference: 'Frente al parque',
    notes: '',
    visits: 4,
    spent: '240.00',
    average_ticket: '60.00',
    is_frequent: true,
    masked: false,
    last_visit: '2026-09-20T19:00:00Z',
    created_at: '2026-05-01T12:00:00Z',
    consent_at: '2026-05-01T12:00:00Z',
    consent_version: '2026-10',
    recent_orders: [],
    ...changes,
  }
}

export function reservation(changes: Partial<Reservation> = {}): Reservation {
  return {
    id: 21,
    customer_id: null,
    customer_name: 'Familia Huamán',
    phone: '912345678',
    party_size: 4,
    reserved_for: '2026-09-26T01:00:00Z',
    ends_at: '2026-09-26T03:00:00Z',
    duration_minutes: 120,
    table_id: 2,
    notes: 'Cumpleaños',
    status: 'booked',
    status_label: 'Reservada',
    created_at: '2026-09-20T12:00:00Z',
    ...changes,
  }
}

export function table(id: number, label: string): TableState {
  return {
    id,
    label,
    position: id,
    is_active: true,
    status: 'free',
    status_label: 'Libre',
    active_order: null,
    created_at: '2026-01-01T00:00:00Z',
  }
}

const PERIOD = { date_from: '2026-08-28', date_to: '2026-09-26', days: 30, timezone: 'America/Lima' }

export function salesSummary(changes: Partial<SalesSummary> = {}): SalesSummary {
  return {
    period: PERIOD,
    sales: '1234.50',
    sales_change_percent: '12.5',
    paid_orders: 40,
    paid_orders_change_percent: '-5',
    average_ticket: '30.86',
    average_ticket_change_percent: '0',
    cancelled_orders: 3,
    cancelled_amount: '45.00',
    previous: {
      date_from: '2026-07-29',
      date_to: '2026-08-27',
      sales: '1097.33',
      paid_orders: 42,
      average_ticket: '26.13',
      cancelled_orders: 2,
      cancelled_amount: '20.00',
    },
    ...changes,
  }
}

export function cell(weekday: number, hour: number, paidOrders: number): HourlyCell {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  return { weekday, weekday_label: days[weekday] ?? '', hour, paid_orders: paidOrders, sales: String(paidOrders * 30), average_sales: '30.00' }
}

export function waste(changes: Partial<WasteReport> = {}): WasteReport {
  return {
    period: PERIOD,
    events: 5,
    total_cost: '82.40',
    pending_classification: 2,
    by_cause: [
      { cause: 'expiration', label: 'Vencimiento', events: 3, cost: '60.00', share_percent: '72.8' },
      { cause: null, label: 'Sin clasificar', events: 2, cost: '22.40', share_percent: '27.2' },
    ],
    by_ingredient: [{ ingredient_id: 4, name: 'Pescado', events: 3, quantity: '1.5', unit: 'kg', cost: '60.00' }],
    ...changes,
  }
}

/** Todas las respuestas del panel de indicadores, con datos en cada sección. */
export function panelReports(): Record<string, unknown> {
  const peak = cell(4, 20, 9)
  return {
    '/insights/summary': salesSummary(),
    '/insights/sales/daily': {
      period: PERIOD,
      days: [
        { date: '2026-09-25', sales: '400.00', paid_orders: 12, average_ticket: '33.33' },
        { date: '2026-09-26', sales: '834.50', paid_orders: 28, average_ticket: '29.80' },
      ],
    },
    '/insights/sales/hourly': { period: PERIOD, cells: [cell(4, 19, 3), peak, cell(5, 13, 0)], peak },
    '/insights/dishes/top': { period: PERIOD, dishes: [{ menu_item_id: 1, name: 'Ceviche', quantity: 18, revenue: '540.00' }] },
    '/insights/payments': {
      period: PERIOD,
      total: '1234.50',
      methods: [{ method: 'yape', label: 'Yape', paid_orders: 25, amount: '800.00', share_percent: '64.8' }],
    },
    '/insights/dishes/margins': {
      period: PERIOD,
      dishes: [
        margin({ menu_item_id: 1, name: 'Ceviche', recipe_cost: '12.00', margin_percent: '60', gross_margin: '324.00' }),
        margin({ menu_item_id: 2, name: 'Chicha', recipe_cost: null, margin_percent: null, gross_margin: null }),
        margin({ menu_item_id: 3, name: 'Promo', recipe_cost: '35.00', margin_percent: '-16.7', gross_margin: '-5.00' }),
      ],
    },
    '/insights/waiters': {
      period: PERIOD,
      waiters: [{ waiter_id: 8, name: 'Luis Rojas', paid_orders: 22, sales: '700.00', average_ticket: '31.82', cancelled_orders: 1, tips: '20.00' }],
    },
    '/insights/low-stock': [{ ingredient_id: 4, name: 'Limón', stock: '0.5', min_stock: '2', missing: '1.5', unit: 'kg' }],
    '/insights/waste': waste(),
  }
}

export function margin(changes: Partial<DishMargin>): DishMargin {
  return {
    menu_item_id: 1,
    name: 'Plato',
    category: 'Fondos',
    price: '30.00',
    quantity_sold: 18,
    revenue: '540.00',
    recipe_cost: null,
    estimated_cost: null,
    unit_margin: null,
    margin_percent: null,
    gross_margin: null,
    ...changes,
  }
}
