import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { decision } from '#jest/fixtures/indicadores'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { AiDecision } from '../../api/types'
import AiAuditView from './AiAuditView'

const RUTA = '/insights/ai-decisions'

const NOTA = decision({
  id: 2,
  kind: 'order_note',
  kind_label: 'Nota de pedido',
  subject_type: 'order_item',
  subject_label: 'Ceviche',
  order_number: 17,
  output: { note_type: 'allergy' },
})
const MERMA = decision({
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
const SIN_SALIDA = decision({ id: 4, subject_label: 'Arroz', output: {} })

function abrir(items: AiDecision[] = [decision(), NOTA, MERMA, SIN_SALIDA], total = items.length) {
  const api = servidor().on('get', RUTA, { items, total })
  entrarComo()
  return { api, ...montar(<AiAuditView />, { path: '/panel/ia' }) }
}

function fila(texto: string): HTMLElement {
  return screen.getByText(texto).closest('tr') as HTMLElement
}

describe('AiAuditView', () => {
  it('cada decisión dice sobre qué fue, qué decidió, con qué motor y confianza', async () => {
    abrir()
    expect(await screen.findByText('4 en total con estos filtros.')).toBeInTheDocument()
    expect(within(fila('Insumo: Limón')).getByText('Comprar hoy')).toBeInTheDocument()
    expect(within(fila('Insumo: Limón')).getByText('87 %')).toBeInTheDocument()
    expect(within(fila('Ceviche · Pedido #17')).getByText('Alergia o restricción')).toBeInTheDocument()
    const merma = fila('Merma (id 99)')
    expect(within(merma).getByText('desconocida')).toBeInTheDocument()
    expect(within(merma).getByText('Regla fija')).toBeInTheDocument()
    expect(within(merma).getByText('Respaldo: sin configurar')).toBeInTheDocument()
    expect(within(fila('Insumo: Arroz')).getByText('—')).toBeInTheDocument()
  })

  it('«Ver JSON» muestra lo que vio el motor y lo que respondió', async () => {
    const { user } = abrir([decision()])
    await user.click(await screen.findByRole('button', { name: 'Ver JSON' }))

    expect(screen.getByText('Estado de entrada')).toBeInTheDocument()
    expect(screen.getByText(/"stock": "0.5"/u)).toBeInTheDocument()
    expect(screen.getByText(/"action": "buy_today"/u)).toBeInTheDocument()
    expect(screen.getByText('Modelo: jev-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('los filtros viajan al servidor y un filtro vacío no se manda', async () => {
    const { api, user } = abrir()
    await screen.findByText('4 en total con estos filtros.')

    await user.selectOptions(screen.getByLabelText('Tipo'), 'Nota de pedido')
    await user.selectOptions(screen.getByLabelText('Motor'), 'Reglas fijas')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Todos los tipos')

    const pedidos = api.llamadas('get', RUTA).map((p) => p.params)
    expect(pedidos[0]).toEqual({ limit: 20, offset: 0 })
    expect(pedidos).toContainEqual({ kind: 'order_note', limit: 20, offset: 0 })
    expect(pedidos.at(-1)).toEqual({ engine: 'rules', limit: 20, offset: 0 })
  })

  it('pagina de a 20 y volver a filtrar regresa a la primera página', async () => {
    const { api, user } = abrir([decision()], 45)
    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(api.llamadas('get', RUTA).at(-1)?.params).toEqual({ limit: 20, offset: 20 })

    await user.selectOptions(screen.getByLabelText('Motor'), 'Jev (IA)')

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(api.llamadas('get', RUTA).at(-1)?.params).toEqual({ engine: 'jev', limit: 20, offset: 0 })
  })

  it('sin decisiones lo dice', async () => {
    abrir([])
    expect(await screen.findByText('No hay decisiones con esos filtros.')).toBeInTheDocument()
  })

  it('si la auditoría falla lo dice', async () => {
    servidor().on('get', RUTA, new RespuestaDeError(403, 'Solo el encargado ve la auditoría'))
    entrarComo()
    montar(<AiAuditView />)
    expect(await screen.findByText('Solo el encargado ve la auditoría')).toBeInTheDocument()
  })
})

describe('AiAuditView: IA externa', () => {
  const RESTAURANTE = '/restaurant'
  const local = (activa: boolean) => ({
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: true,
    max_waiter_discount_percent: '10.00',
    external_ai_enabled: activa,
    created_at: '2026-09-26T13:00:00Z',
  })

  it('el encargado la apaga y nada sale del sistema', async () => {
    const api = servidor().on('get', RUTA, { items: [], total: 0 }).on('get', RESTAURANTE, local(true))
    api.on('patch', RESTAURANTE, local(false))
    entrarComo()
    const { user } = montar(<AiAuditView />, { path: '/panel/ia' })

    const casilla = await screen.findByRole('checkbox', { name: 'Usar la IA externa' })
    expect(casilla).toBeChecked()
    await user.click(casilla)

    expect(await screen.findByText('La IA externa quedó apagada: deciden las reglas y nada sale del sistema.')).toBeInTheDocument()
    expect(api.llamadas('patch', RESTAURANTE)[0]?.body).toEqual({ external_ai_enabled: false })
  })

  it('quien solo ve el panel no la puede cambiar', async () => {
    const api = servidor().on('get', RUTA, { items: [], total: 0 })
    entrarComo(['insights.read'])
    montar(<AiAuditView />, { path: '/panel/ia' })

    expect(await screen.findByText('0 en total con estos filtros.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Usar la IA externa' })).not.toBeInTheDocument()
    expect(api.llamadas('get', RESTAURANTE)).toHaveLength(0)
  })
})
