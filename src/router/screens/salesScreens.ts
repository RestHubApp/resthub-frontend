import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de reservas, clientes, caja y comprobantes. */
export const SALES_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.reservations,
    permission: PERMISSION.reservationsRead,
    nav: { label: 'Reservas', icon: 'reservations', description: 'Las reservas de cada día: a qué hora, cuántos y en qué mesa.' },
    load: asDefault(() => import('@/features/reservations/ReservationsView'), 'ReservationsView'),
  },
  {
    path: routePatterns.customers,
    permission: PERMISSION.customersRead,
    nav: { label: 'Clientes', icon: 'customers', description: 'Los clientes frecuentes, sus datos de delivery y lo que gastan.' },
    load: asDefault(() => import('@/features/customers/CustomersView'), 'CustomersView'),
  },
  {
    path: routePatterns.cash,
    permission: PERMISSION.cashManage,
    nav: {
      label: 'Caja',
      icon: 'cashRegister',
      description: 'Abrir y cerrar la caja del turno, con su arqueo y las propinas de cada mesero.',
    },
    load: asDefault(() => import('@/features/cash/CashView'), 'CashView'),
    prefetch: prefetchOf(() => import('@/features/cash/prefetchCash'), 'prefetchCash'),
  },
  {
    path: routePatterns.billing,
    permission: PERMISSION.billingManage,
    nav: {
      label: 'Comprobantes',
      icon: 'recipe',
      description: 'Boletas y facturas electrónicas, los datos fiscales y lo que falta enviar a SUNAT.',
    },
    load: asDefault(() => import('./BillingScreen'), 'BillingScreen'),
  },
  { path: routePatterns.invoicePrint, permission: PERMISSION.billingIssue, load: asDefault(() => import('@/features/billing/InvoicePrintView'), 'InvoicePrintView') },
]
