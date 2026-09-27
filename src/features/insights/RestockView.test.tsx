import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { insumoARevisar, reposicion } from '#jest/fixtures/indicadores'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { RestockReport } from '../../api/types'
import RestockView from './RestockView'

const RUTA = '/insights/restock'
const ACTUALIZAR = { name: 'Actualizar recomendaciones' }

const LIMON = insumoARevisar()
const ARROZ = insumoARevisar({
  ingredient_id: 2,
  name: 'Arroz',
  action: 'wait',
  action_label: 'Esperar',
  urgency: 0,
  urgency_label: 'Ninguna',
  urgency_score: 0,
  coverage_days: null,
  trend: 'stable',
  trend_label: 'Estable',
  usage_change_percent: null,
  engine: 'rules',
  confidence: null,
  fallback_reason: 'unavailable',
  fallback_label: 'Jev no respondió a tiempo',
})
const PAPA = insumoARevisar({ ingredient_id: 3, name: 'Papa', action: 'buy_this_week', action_label: 'Comprar esta semana', urgency_score: 50 })

function abrir(informe: RestockReport | RespuestaDeError = reposicion([ARROZ, PAPA, LIMON])) {
  const api = servidor().on('get', RUTA, informe)
  entrarComo()
  return { api, ...montar(<RestockView />, { path: '/panel/reposicion' }) }
}

function nombres(): string[] {
  const lista = screen.getByRole('list', { name: 'Recomendaciones por insumo' })
  return within(lista).getAllByRole('heading').map((h) => h.textContent)
}

describe('RestockView', () => {
  it('ordena por urgencia y deja plegado lo que puede esperar', async () => {
    const { user } = abrir()
    await screen.findByRole('list', { name: 'Recomendaciones por insumo' })
    expect(nombres()).toEqual(['Limón', 'Papa'])

    await user.click(screen.getByRole('button', { name: 'Ver también los 1 insumos que pueden esperar' }))

    expect(nombres()).toEqual(['Limón', 'Papa', 'Arroz'])
  })

  it('cada tarjeta explica la decisión con sus números y el motor', async () => {
    const { user } = abrir()
    const limon = (await screen.findByRole('heading', { name: 'Limón' })).closest('li') as HTMLElement
    expect(within(limon).getByText('Se acaba mañana y el consumo sube.')).toBeInTheDocument()
    expect(within(limon).getByText('Urgencia crítica')).toBeInTheDocument()
    expect(within(limon).getByText('0.5 kg / 2 kg')).toBeInTheDocument()
    expect(within(limon).getByText('0.7 días')).toBeInTheDocument()
    expect(within(limon).getByText('(+25.0 %)')).toBeInTheDocument()
    expect(within(limon).getByText('87 %')).toBeInTheDocument()
    expect(within(limon).getByTitle('Decidió Jev, el modelo de decisiones de TypeSafe AI')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ver también/u }))
    const arroz = screen.getByRole('heading', { name: 'Arroz' }).closest('li') as HTMLElement
    expect(within(arroz).getByText('Sin consumo')).toBeInTheDocument()
    expect(within(arroz).getByText('Regla fija')).toBeInTheDocument()
    expect(within(arroz).getByTitle('Jev no respondió a tiempo')).toHaveTextContent('Respaldo: no disponible')
  })

  it('las tarjetas del resumen filtran por acción y se desmarcan al tocarlas otra vez', async () => {
    const { user } = abrir()
    const resumen = await screen.findByRole('region', { name: 'Resumen por acción' })
    const semana = within(resumen).getByRole('button', { name: /Comprar esta semana/u })

    await user.click(semana)
    expect(semana).toHaveAttribute('aria-pressed', 'true')
    expect(nombres()).toEqual(['Papa'])

    await user.click(within(resumen).getByRole('button', { name: /Revisar merma/u }))
    expect(screen.getByText('No hay insumos con esa acción.')).toBeInTheDocument()

    await user.click(within(resumen).getByRole('button', { name: /Revisar merma/u }))
    expect(nombres()).toEqual(['Limón', 'Papa'])
  })

  it('una vista previa sin guardar lo avisa y no dice cuándo se actualizó', async () => {
    abrir(reposicion([LIMON], { refreshed_at: null }))
    expect(await screen.findByText(/Es una vista previa calculada con las reglas fijas/u)).toBeInTheDocument()
    expect(screen.queryByText(/Última actualización/u)).not.toBeInTheDocument()
  })

  it('con recomendaciones de más de un día pide actualizarlas', async () => {
    abrir(reposicion([insumoARevisar({ is_stale: true })]))
    expect(await screen.findByText('Algunas recomendaciones tienen más de un día. Actualízalas antes de comprar.')).toBeInTheDocument()
  })

  it('«Actualizar recomendaciones» decide de nuevo y muestra lo nuevo', async () => {
    const { api, user } = abrir(reposicion([LIMON]))
    api.on('post', '/insights/restock/refresh', reposicion([PAPA]))
    await screen.findByRole('heading', { name: 'Limón' })

    await user.click(screen.getByRole('button', ACTUALIZAR))

    expect(await screen.findByRole('heading', { name: 'Papa' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Limón' })).not.toBeInTheDocument()
  })

  it('si actualizar falla lo dice y deja la recomendación anterior', async () => {
    const { api, user } = abrir(reposicion([LIMON]))
    api.on('post', '/insights/restock/refresh', new RespuestaDeError(504, 'La IA tardó demasiado'))
    await screen.findByRole('heading', { name: 'Limón' })

    await user.click(screen.getByRole('button', ACTUALIZAR))

    expect(await screen.findByText('La IA tardó demasiado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Limón' })).toBeInTheDocument()
  })

  it('si no se puede cargar lo dice', async () => {
    abrir(new RespuestaDeError(500, []))
    expect(await screen.findByText('No se pudo cargar la reposición.')).toBeInTheDocument()
  })
})
