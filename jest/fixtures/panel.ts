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

export function ajustesFiscales(cambios: Partial<BillingSettings> = {}): BillingSettings {
  return {
    ruc: '20123456789',
    legal_name: 'La Picantería S.A.C.',
    address: 'Av. Larco 123, Miraflores',
    igv_rate: '18.00',
    boleta_series: 'B001',
    factura_series: 'F001',
    provider_url: 'https://api.nubefact.com/api/v1/abc',
    has_provider_token: true,
    is_ready: true,
    ...cambios,
  }
}

export function comprobante(cambios: Partial<Invoice> = {}): Invoice {
  return {
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
    pdf_url: '',
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
    lines: [{ description: 'Ceviche', quantity: 2, unit_price: '30.00', total: '60.00' }],
    ...cambios,
  }
}

export function cliente(cambios: Partial<Customer> = {}): Customer {
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
    last_visit: '2026-09-20T19:00:00Z',
    created_at: '2026-05-01T12:00:00Z',
    recent_orders: [],
    ...cambios,
  }
}

export function reserva(cambios: Partial<Reservation> = {}): Reservation {
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
    ...cambios,
  }
}

export function mesa(id: number, label: string): TableState {
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

const PERIODO = { date_from: '2026-08-28', date_to: '2026-09-26', days: 30, timezone: 'America/Lima' }

export function resumenDeVentas(cambios: Partial<SalesSummary> = {}): SalesSummary {
  return {
    period: PERIODO,
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
    ...cambios,
  }
}

export function celda(weekday: number, hour: number, paid_orders: number): HourlyCell {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  return { weekday, weekday_label: dias[weekday] ?? '', hour, paid_orders, sales: String(paid_orders * 30), average_sales: '30.00' }
}

export function merma(cambios: Partial<WasteReport> = {}): WasteReport {
  return {
    period: PERIODO,
    events: 5,
    total_cost: '82.40',
    pending_classification: 2,
    by_cause: [
      { cause: 'expiration', label: 'Vencimiento', events: 3, cost: '60.00', share_percent: '72.8' },
      { cause: null, label: 'Sin clasificar', events: 2, cost: '22.40', share_percent: '27.2' },
    ],
    by_ingredient: [{ ingredient_id: 4, name: 'Pescado', events: 3, quantity: '1.5', unit: 'kg', cost: '60.00' }],
    ...cambios,
  }
}

/** Todas las respuestas del panel de indicadores, con datos en cada sección. */
export function reportesDelPanel(): Record<string, unknown> {
  const pico = celda(4, 20, 9)
  return {
    '/insights/summary': resumenDeVentas(),
    '/insights/sales/daily': {
      period: PERIODO,
      days: [
        { date: '2026-09-25', sales: '400.00', paid_orders: 12, average_ticket: '33.33' },
        { date: '2026-09-26', sales: '834.50', paid_orders: 28, average_ticket: '29.80' },
      ],
    },
    '/insights/sales/hourly': { period: PERIODO, cells: [celda(4, 19, 3), pico, celda(5, 13, 0)], peak: pico },
    '/insights/dishes/top': { period: PERIODO, dishes: [{ menu_item_id: 1, name: 'Ceviche', quantity: 18, revenue: '540.00' }] },
    '/insights/payments': {
      period: PERIODO,
      total: '1234.50',
      methods: [{ method: 'yape', label: 'Yape', paid_orders: 25, amount: '800.00', share_percent: '64.8' }],
    },
    '/insights/dishes/margins': {
      period: PERIODO,
      dishes: [
        margen({ menu_item_id: 1, name: 'Ceviche', recipe_cost: '12.00', margin_percent: '60', gross_margin: '324.00' }),
        margen({ menu_item_id: 2, name: 'Chicha', recipe_cost: null, margin_percent: null, gross_margin: null }),
        margen({ menu_item_id: 3, name: 'Promo', recipe_cost: '35.00', margin_percent: '-16.7', gross_margin: '-5.00' }),
      ],
    },
    '/insights/waiters': {
      period: PERIODO,
      waiters: [{ waiter_id: 8, name: 'Luis Rojas', paid_orders: 22, sales: '700.00', average_ticket: '31.82', cancelled_orders: 1, tips: '20.00' }],
    },
    '/insights/low-stock': [{ ingredient_id: 4, name: 'Limón', stock: '0.5', min_stock: '2', missing: '1.5', unit: 'kg' }],
    '/insights/waste': merma(),
  }
}

export function margen(cambios: Partial<DishMargin>): DishMargin {
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
    ...cambios,
  }
}
