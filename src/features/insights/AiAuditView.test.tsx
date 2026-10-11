import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { decision } from '#jest/fixtures/indicadores'
import { signInAs, handleMount, ErrorResponse, server } from '#jest/harness'
import type { AiDecision } from '@/api/types'
import { AiAuditView } from './AiAuditView'

const ROUTE = '/insights/ai-decisions'

const NOTE = decision({
  id: 2,
  kind: 'order_note',
  kind_label: 'Nota de pedido',
  subject_type: 'order_item',
  subject_label: 'Ceviche',
  order_number: 17,
  output: { note_type: 'allergy' },
})
const WASTE = decision({
  id: 3,
  kind: 'waste_cause',
  kind_label: 'Causa de merma',
  engine: 'rules',
  confidence: null,
  confidence_kind: 'rule',
  confidence_kind_label: 'Regla fija',
  fallback_reason: 'not_configured',
  subject_type: 'stock_movement',
  subject_label: null,
  subject_id: 99,
  model: null,
  output: { cause: 'desconocida' },
})
const WITHOUT_OUTPUT = decision({ id: 4, subject_label: 'Arroz', output: {} })

function open(items: AiDecision[] = [decision(), NOTE, WASTE, WITHOUT_OUTPUT], total = items.length) {
  const api = server().on('get', ROUTE, { items, total })
  signInAs()
  return { api, ...handleMount(<AiAuditView />, { path: '/panel/ia' }) }
}

function row(text: string): HTMLElement {
  return screen.getByText(text).closest('tr') as HTMLElement
}

describe('AiAuditView', () => {
  it('cada decisión dice sobre qué fue, qué decidió, con qué motor y confianza', async () => {
    open()
    expect(await screen.findByText('4 en total con estos filtros.')).toBeInTheDocument()
    expect(within(row('Insumo: Limón')).getByText('Comprar hoy')).toBeInTheDocument()
    expect(within(row('Insumo: Limón')).getByText('87 %')).toBeInTheDocument()
    expect(within(row('Ceviche · Pedido #17')).getByText('Alergia o restricción')).toBeInTheDocument()
    const waste = row('Merma (id 99)')
    expect(within(waste).getByText('desconocida')).toBeInTheDocument()
    expect(within(waste).getByText('Regla fija')).toBeInTheDocument()
    expect(within(waste).getByText('Respaldo: sin configurar')).toBeInTheDocument()
    expect(within(row('Insumo: Arroz')).getByText('—')).toBeInTheDocument()
  })

  it('«Ver JSON» muestra lo que vio el motor y lo que respondió', async () => {
    const { user } = open([decision()])
    await user.click(await screen.findByRole('button', { name: 'Ver JSON' }))

    expect(screen.getByText('Estado de entrada')).toBeInTheDocument()
    expect(screen.getByText(/"stock": "0.5"/u)).toBeInTheDocument()
    expect(screen.getByText(/"action": "buy_today"/u)).toBeInTheDocument()
    expect(screen.getByText('Modelo: jev-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('los filtros viajan al servidor y un filtro vacío no se manda', async () => {
    const { api, user } = open()
    await screen.findByText('4 en total con estos filtros.')

    await user.selectOptions(screen.getByLabelText('Tipo'), 'Nota de pedido')
    await user.selectOptions(screen.getByLabelText('Motor'), 'Reglas fijas')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Todos los tipos')

    const orders = api.calls('get', ROUTE).map((p) => p.params)
    expect(orders[0]).toEqual({ limit: 20, offset: 0 })
    expect(orders).toContainEqual({ kind: 'order_note', limit: 20, offset: 0 })
    expect(orders.at(-1)).toEqual({ engine: 'rules', limit: 20, offset: 0 })
  })

  it('pagina de a 20 y volver a filtrar regresa a la primera página', async () => {
    const { api, user } = open([decision()], 45)
    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(api.calls('get', ROUTE).at(-1)?.params).toEqual({ limit: 20, offset: 20 })

    await user.selectOptions(screen.getByLabelText('Motor'), 'Jev (IA)')

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(api.calls('get', ROUTE).at(-1)?.params).toEqual({ engine: 'jev', limit: 20, offset: 0 })
  })

  it('sin decisiones lo dice', async () => {
    open([])
    expect(await screen.findByText('No hay decisiones con esos filtros.')).toBeInTheDocument()
  })

  it('si la auditoría falla lo dice', async () => {
    server().on('get', ROUTE, new ErrorResponse(403, 'Solo el encargado ve la auditoría'))
    signInAs()
    handleMount(<AiAuditView />)
    expect(await screen.findByText('Solo el encargado ve la auditoría')).toBeInTheDocument()
  })
})

describe('AiAuditView: IA externa', () => {
  const RESTAURANT = '/restaurant'
  const local = (active: boolean) => ({
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: true,
    max_waiter_discount_percent: '10.00',
    external_ai_enabled: active,
    created_at: '2026-09-26T13:00:00Z',
  })

  it('el encargado la apaga y nada sale del sistema', async () => {
    const api = server().on('get', ROUTE, { items: [], total: 0 }).on('get', RESTAURANT, local(true))
    api.on('patch', RESTAURANT, local(false))
    signInAs()
    const { user } = handleMount(<AiAuditView />, { path: '/panel/ia' })

    const checkbox = await screen.findByRole('checkbox', { name: 'Usar la IA externa' })
    expect(checkbox).toBeChecked()
    await user.click(checkbox)

    expect(await screen.findByText('La IA externa quedó apagada: deciden las reglas y nada sale del sistema.')).toBeInTheDocument()
    expect(api.calls('patch', RESTAURANT)[0]?.body).toEqual({ external_ai_enabled: false })
  })

  it('quien solo ve el panel no la puede cambiar', async () => {
    const api = server().on('get', ROUTE, { items: [], total: 0 })
    signInAs(['insights.read'])
    handleMount(<AiAuditView />, { path: '/panel/ia' })

    expect(await screen.findByText('0 en total con estos filtros.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Usar la IA externa' })).not.toBeInTheDocument()
    expect(api.calls('get', RESTAURANT)).toHaveLength(0)
  })
})
