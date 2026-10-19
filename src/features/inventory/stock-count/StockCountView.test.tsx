import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { countDifferences, countLine, packaging, stockCount } from '#jest/fixtures/stockControl'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import { StockCountView } from './StockCountView'

const COUNT = '/inventory/stock-counts/3'
const LINES = `${COUNT}/lines`
const CLOSE = { name: 'Cerrar conteo' }
const CLOSED_AT = '2026-09-26T15:00:00Z'
const PISCO_FORM = { name: 'Conteo de Pisco' }
const PISCO_COUNTED = countLine({
  ingredient_id: 2,
  ingredient_name: 'Pisco',
  unit: 'ml',
  packaging: packaging(),
  expected: '3000',
  counted: '2625',
  entry_mode: 'packages',
  entry_quantity: '3.5',
})

function open(count = stockCount(), permissions = PERMISSIONS_OWNER) {
  const api = server().on('get', COUNT, count)
  signInAs(permissions)
  return { api, ...mountScreen(<StockCountView />, { path: '/inventario/conteos/:countId', en: '/inventario/conteos/3' }) }
}

// Intl separa la cantidad de la unidad con un espacio que no se corta.
function flat(text: string | null): string {
  return (text ?? '').replaceAll(/\s/gu, ' ')
}

describe('contar', () => {
  it('cuenta el pisco en botellas con la conversión en vivo y guarda solo esa línea', async () => {
    const { api, user } = open()
    const pisco = await screen.findByRole('form', PISCO_FORM)
    expect(screen.getAllByText('Pendiente')).toHaveLength(2)

    await user.type(within(pisco).getByLabelText('Cantidad (botella)'), '3.5')
    expect(flat(within(pisco).getByText(/^=/u).textContent)).toBe('= 2.625 L')

    api.on('put', LINES, stockCount({ counted_lines: 1, lines: [countLine(), PISCO_COUNTED] }))
    await user.click(within(pisco).getByRole('button', { name: 'Guardar' }))

    expect(flat((await screen.findByText(/Contado:/u)).textContent)).toBe('Contado: 2.625 L')
    expect(screen.getAllByText('Pendiente')).toHaveLength(1)
    expect(api.calls('put', LINES)[0]?.body).toEqual({ lines: [{ ingredient_id: 2, mode: 'packages', quantity: '3.5', full_packages: '0' }] })
    expect(screen.getByText('insumos contados', { exact: false })).toHaveTextContent('1 de 2 insumos contados')
  })

  it('por peso pide el abierto y los cerrados, y avisa si pesa como vacío', async () => {
    const { user } = open()
    const pisco = await screen.findByRole('form', PISCO_FORM)
    await user.click(within(pisco).getByRole('radio', { name: 'Por peso' }))
    await user.type(within(pisco).getByLabelText('Peso del abierto (g)'), '450')
    await user.type(within(pisco).getByLabelText('Cerrados, además'), '2')

    expect(within(pisco).getByText(/cuenta como vacío/u)).toHaveTextContent('= 1.5 L')
  })

  it('busca por nombre sin tildes y filtra los pendientes', async () => {
    const { user } = open(stockCount({ counted_lines: 1, lines: [countLine({ ingredient_name: 'Limón' }), PISCO_COUNTED] }))
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar insumo' }), 'limon')
    expect(screen.getByRole('form', { name: 'Conteo de Limón' })).toBeInTheDocument()
    expect(screen.queryByRole('form', PISCO_FORM)).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar insumo' }))
    await user.click(screen.getByRole('radio', { name: 'Contados' }))
    expect(screen.getByRole('form', PISCO_FORM)).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Conteo de Limón' })).not.toBeInTheDocument()
  })

  it('al cerrar avisa cuántos quedaron sin contar y pasa al reporte', async () => {
    const { api, user } = open(stockCount({ counted_lines: 1, lines: [countLine(), PISCO_COUNTED] }))
    await user.click(await screen.findByRole('button', CLOSE))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Cerrar el conteo #2?' })
    expect(confirm).toHaveTextContent('Queda 1 insumo sin contar: no se ajusta y su stock sigue igual.')

    const closed = stockCount({ status: 'closed', status_label: 'Cerrado', closed_at: CLOSED_AT, counted_lines: 1 })
    api
      .on('post', `${COUNT}/close`, closed)
      .on('get', COUNT, closed)
      .on('get', `${COUNT}/differences`, countDifferences())
    await user.click(within(confirm).getByRole('button', { name: 'Cerrar y ajustar' }))

    expect(await screen.findByText('Conteo #2 cerrado. El stock quedó ajustado a lo contado.')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Diferencias por insumo' })).toBeInTheDocument()
    expect(api.calls('post', `${COUNT}/close`)).toHaveLength(1)
  })

  it('sin nada contado no deja cerrar; un conteo que ya no está en curso se explica por su código', async () => {
    const { api, user } = open()
    expect(await screen.findByRole('button', CLOSE)).toBeDisabled()

    api.on('post', `${COUNT}/cancel`, new ErrorResponse(409, 'El conteo #2 ya está Cerrado.', 'stock_count_not_open'))
    await user.click(screen.getByRole('button', { name: 'Cancelar conteo' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar conteo' }))

    expect(await screen.findByText('Ese conteo ya no está en curso: alguien lo cerró o lo canceló.')).toBeInTheDocument()
  })

  it('quien solo lee ve el avance, sin campos ni botones de cierre', async () => {
    open(stockCount(), ['inventory.read'])
    expect(await screen.findByRole('heading', { name: 'Pisco' })).toBeInTheDocument()
    expect(screen.queryByRole('form', PISCO_FORM)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', CLOSE)).not.toBeInTheDocument()
  })
})

describe('reporte de diferencias', () => {
  const CLOSED = stockCount({ status: 'closed', status_label: 'Cerrado', closed_at: CLOSED_AT, counted_lines: 2 })

  it('muestra el total arriba, ordena por pérdida y marca las diferencias grandes con texto', async () => {
    const { api } = open(CLOSED)
    api.on('get', `${COUNT}/differences`, countDifferences())

    const table = await screen.findByRole('region', { name: 'Diferencias por insumo' })
    expect(flat(screen.getByText('Neto').nextElementSibling?.textContent ?? null)).toBe('−S/ 29.60')
    expect(flat(screen.getByText('Faltó').nextElementSibling?.textContent ?? null)).toBe('−S/ 30.00')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Pisco')
    expect(rows[0]).toHaveTextContent('Diferencia grande')
    expect(rows[1]).toHaveTextContent('Limón')
    expect(rows[1]).not.toHaveTextContent('Diferencia grande')
  })

  it('abre la tendencia de un insumo con sus últimos conteos', async () => {
    const { api, user } = open(CLOSED)
    api.on('get', `${COUNT}/differences`, countDifferences()).on('get', '/inventory/ingredients/2/count-differences', {
      ingredient_id: 2,
      ingredient_name: 'Pisco',
      unit: 'ml',
      items: [
        { count_id: 3, count_number: 2, closed_at: CLOSED_AT, expected: '3000', counted: '2250', difference: '-750', difference_percent: '-25.00', unit_cost: '0.04', difference_value: '-30.00' },
        { count_id: 1, count_number: 1, closed_at: '2026-09-01T15:00:00Z', expected: '2000', counted: '1900', difference: '-100', difference_percent: '-5.00', unit_cost: '0.04', difference_value: '-4.00' },
      ],
    })
    await user.click(await screen.findByRole('button', { name: 'Tendencia de Pisco' }))

    const sheet = await screen.findByRole('dialog', { name: 'Tendencia: Pisco' })
    const bars = await within(sheet).findByRole('list', { name: 'Diferencias de Pisco por conteo' })
    expect(within(bars).getAllByRole('listitem').map((bar) => flat(bar.textContent))).toEqual(['Conteo #2−S/ 30.00', 'Conteo #1−S/ 4.00'])
  })
})
