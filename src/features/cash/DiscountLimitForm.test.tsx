import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { OwnRestaurant } from '../../api/types'
import DiscountLimitForm from './DiscountLimitForm'

const CAMPO = 'Descuento máximo del mesero (%)'
const GUARDAR = { name: 'Guardar tope' }
const RUTA = '/restaurant'

function restaurante(cambios: Partial<OwnRestaurant> = {}): OwnRestaurant {
  return {
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: false,
    created_at: '2026-01-01T00:00:00Z',
    max_waiter_discount_percent: '10.00',
    ...cambios,
  }
}

function abrir() {
  const api = servidor().on('get', RUTA, restaurante())
  entrarComo()
  return { api, ...montar(<DiscountLimitForm />) }
}

describe('DiscountLimitForm', () => {
  it('parte del tope guardado y no deja guardar sin cambios', async () => {
    abrir()
    expect(await screen.findByDisplayValue('10.00')).toBe(screen.getByLabelText(CAMPO))
    expect(screen.getByRole('button', GUARDAR)).toBeDisabled()
  })

  it('guarda el tope nuevo con punto decimal y lo anuncia', async () => {
    const { api, user } = abrir()
    api.on('patch', RUTA, restaurante({ max_waiter_discount_percent: '12.50' }))
    const campo = await screen.findByDisplayValue('10.00')

    await user.clear(campo)
    await user.type(campo, '12,5')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('El mesero descuenta hasta 12.5 %.')).toBeInTheDocument()
    expect(api.llamadas('patch', RUTA)[0]?.body).toEqual({ max_waiter_discount_percent: '12.5' })
  })

  it('un porcentaje mayor a 100 queda marcado y no se puede guardar', async () => {
    const { user } = abrir()
    const campo = await screen.findByDisplayValue('10.00')

    await user.clear(campo)
    await user.type(campo, '101')

    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', GUARDAR)).toBeDisabled()
  })

  it('si el servidor lo rechaza, lo avisa', async () => {
    const { api, user } = abrir()
    api.on('patch', RUTA, new RespuestaDeError(403, 'Solo el encargado cambia el tope'))
    const campo = await screen.findByDisplayValue('10.00')

    await user.clear(campo)
    await user.type(campo, '5')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('Solo el encargado cambia el tope')).toBeInTheDocument()
  })
})
