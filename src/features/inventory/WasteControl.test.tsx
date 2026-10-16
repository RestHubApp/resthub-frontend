// Control de mermas desde el inventario: el envase de un insumo, la compra en
// envases, la merma que queda por aprobar, el monto del local y empezar un conteo.
import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ingredient, stockChange } from '#jest/fixtures/inventory'
import { packaging, stockCount, wasteApproval } from '#jest/fixtures/stockControl'
import { ErrorResponse, mountScreen, server, signInAs } from '#jest/harness'
import { InventoryView } from './InventoryView'

const INGREDIENTS = '/inventory/ingredients'
const ROOT = '/inventario'
const START = { name: 'Iniciar conteo' }
const STOCK_COUNTS = '/inventory/stock-counts'
const RESTAURANT_PATH = '/restaurant'
const PISCO = ingredient({ id: 2, name: 'Pisco', unit: 'ml', unit_label: 'mililitros', stock: '3000', min_stock: '0', unit_cost: '0.04', packaging: packaging() })
const RESTAURANT = {
  id: 1,
  name: 'La Picantería',
  slug: 'la-picanteria',
  timezone: 'America/Lima',
  is_active: true,
  auto_out_of_stock: false,
  created_at: '2026-01-01T00:00:00Z',
  max_waiter_discount_percent: '10.00',
  external_ai_enabled: true,
  waste_approval_threshold: '50.00',
}

function open(en = ROOT) {
  const api = server()
    .on('get', INGREDIENTS, [PISCO])
    .on('get', '/inventory/alerts/low-stock', [])
    .on('get', RESTAURANT_PATH, RESTAURANT)
    .on('get', STOCK_COUNTS, { items: [], total: 0 })
  signInAs()
  return { api, ...mountScreen(<InventoryView />, { path: ROOT, en }) }
}

describe('envase del insumo', () => {
  it('guarda la botella con sus pesos, en la unidad base', async () => {
    const { api, user } = open()
    api.on('post', INGREDIENTS, PISCO)
    await user.click(await screen.findByRole('button', { name: 'Nuevo insumo' }))
    const window = await screen.findByRole('dialog', { name: 'Nuevo insumo' })

    await user.type(within(window).getByLabelText('Nombre'), 'Pisco')
    await user.selectOptions(within(window).getByLabelText('Cómo se mide'), 'ml')
    await user.type(within(window).getByLabelText('Cuánto trae'), '750')
    await user.type(within(window).getByLabelText('Tipo de envase'), 'botella')
    await user.type(within(window).getByLabelText('Peso lleno (g)'), '1250')
    await user.click(within(window).getByRole('button', { name: 'Crear insumo' }))
    expect(await within(window).findByText('Para contar por peso escribe los dos pesos, o deja los dos vacíos')).toBeInTheDocument()

    await user.type(within(window).getByLabelText('Peso vacío (g)'), '500')
    await user.click(within(window).getByRole('button', { name: 'Crear insumo' }))

    expect(await screen.findByText('Insumo Pisco creado.')).toBeInTheDocument()
    expect(api.calls('post', INGREDIENTS)[0]?.body).toMatchObject({
      unit: 'ml',
      packaging: { size: '750', label: 'botella', full_weight_g: '1250', empty_weight_g: '500' },
    })
  })

  it('el servidor que rechaza el envase se explica por su código', async () => {
    const { api, user } = open()
    api.on('patch', `${INGREDIENTS}/2`, new ErrorResponse(422, 'detalle técnico', 'invalid_packaging'))
    await user.click(await screen.findByRole('button', { name: 'Más acciones de Pisco' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const window = await screen.findByRole('dialog', { name: 'Editar: Pisco' })
    expect(within(window).getByLabelText('Cuánto trae')).toHaveValue('750')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await within(window).findByText(/Revisa el envase/u)).toBeInTheDocument()
  })
})

describe('compras y mermas', () => {
  it('compra en botellas: muestra la conversión y envía cuántas', async () => {
    const { api, user } = open()
    api.on('post', '/inventory/purchases', stockChange(ingredient({ ...PISCO, stock: '6000' })))
    await user.click(await screen.findByRole('button', { name: 'Compra de Pisco' }))
    const window = await screen.findByRole('dialog', { name: 'Registrar compra: Pisco' })

    await user.type(within(window).getByLabelText('Cantidad comprada'), '4')
    await user.selectOptions(within(window).getByLabelText('Unidad de cantidad comprada'), 'package')
    expect(within(window).getByText(/4 × botella de 750\sml = 3\sL/u)).toBeInTheDocument()
    await user.click(within(window).getByRole('button', { name: 'Registrar compra' }))

    expect(await screen.findByText(/Compra registrada/u)).toBeInTheDocument()
    expect(api.calls('post', '/inventory/purchases')[0]?.body).toMatchObject({ entry_mode: 'packages', quantity: '4', unit_cost: '0.04' })
  })

  it('una merma que pasa el monto avisa antes y, con el 202, dice que queda por aprobar', async () => {
    const { api, user } = open()
    api.on('post', '/inventory/waste', wasteApproval(), 202)
    await user.click(await screen.findByRole('button', { name: 'Más acciones de Pisco' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Merma' }))
    const window = await screen.findByRole('dialog', { name: 'Registrar merma: Pisco' })

    await user.type(within(window).getByLabelText('Cantidad perdida'), '1500')
    expect(within(window).getByRole('status')).toHaveTextContent(/quedará por aprobar/u)
    await user.type(within(window).getByLabelText('Motivo'), 'Se rompieron dos botellas')
    await user.click(within(window).getByRole('button', { name: 'Registrar merma' }))

    expect(await screen.findByText(/supera el monto del local: queda por aprobar/u)).toBeInTheDocument()
  })
})

describe('reglas y conteos', () => {
  it('el monto de aprobación se guarda y vacío la apaga', async () => {
    const { api, user } = open()
    api.on('patch', RESTAURANT_PATH, { ...RESTAURANT, waste_approval_threshold: null })
    await user.click(await screen.findByRole('button', { name: 'Reglas de stock' }))
    const field = await screen.findByLabelText('Pedir aprobación de mermas desde (S/)')
    expect(field).toHaveValue('50.00')

    await user.clear(field)
    await user.click(screen.getByRole('button', { name: 'Guardar monto' }))

    expect(await screen.findByText('Las mermas ya no piden aprobación.')).toBeInTheDocument()
    expect(api.calls('patch', RESTAURANT_PATH)[0]?.body).toEqual({ waste_approval_threshold: null })
  })

  it('empieza un conteo de algunos insumos y lleva a la lista para contar', async () => {
    const { api, user } = open('/inventario?vista=conteos')
    api.on('post', STOCK_COUNTS, stockCount({ scope: 'selected', total_lines: 1 }), 201)
    await user.click(await screen.findByRole('button', START))
    const window = await screen.findByRole('dialog', { name: 'Iniciar conteo físico' })

    await user.click(within(window).getByRole('radio', { name: 'Solo algunos' }))
    await user.click(within(window).getByRole('button', START))
    expect(within(window).getByText('Elige al menos un insumo para contar.')).toBeInTheDocument()

    await user.click(within(window).getByRole('checkbox', { name: 'Pisco' }))
    await user.type(within(window).getByLabelText('Nota (opcional)'), 'Barra')
    await user.click(within(window).getByRole('button', START))

    expect(await screen.findByLabelText('Ruta actual')).toHaveTextContent('/inventario/conteos/3')
    expect(api.calls('post', STOCK_COUNTS)[0]?.body).toEqual({ scope: 'selected', ingredient_ids: [2], note: 'Barra' })
  })
})
