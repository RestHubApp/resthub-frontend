import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { OwnRestaurant } from '@/api/types'
import { DiscountLimitForm } from './DiscountLimitForm'

const FIELD = 'Descuento máximo del mesero (%)'
const SAVE = { name: 'Guardar tope' }
const ROUTE = '/restaurant'

function restaurant(changes: Partial<OwnRestaurant> = {}): OwnRestaurant {
  return {
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: false,
    created_at: '2026-01-01T00:00:00Z',
    max_waiter_discount_percent: '10.00',
    external_ai_enabled: true,
    ...changes,
  }
}

function open() {
  const api = servidor().on('get', ROUTE, restaurant())
  entrarComo()
  return { api, ...montar(<DiscountLimitForm />) }
}

describe('DiscountLimitForm', () => {
  it('parte del tope guardado y no deja guardar sin cambios', async () => {
    open()
    expect(await screen.findByDisplayValue('10.00')).toBe(screen.getByLabelText(FIELD))
    expect(screen.getByRole('button', SAVE)).toBeDisabled()
  })

  it('guarda el tope nuevo con punto decimal y lo anuncia', async () => {
    const { api, user } = open()
    api.on('patch', ROUTE, restaurant({ max_waiter_discount_percent: '12.50' }))
    const field = await screen.findByDisplayValue('10.00')

    await user.clear(field)
    await user.type(field, '12,5')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('El mesero descuenta hasta 12.5 %.')).toBeInTheDocument()
    expect(api.llamadas('patch', ROUTE)[0]?.body).toEqual({ max_waiter_discount_percent: '12.5' })
  })

  it('un porcentaje mayor a 100 queda marcado y no se puede guardar', async () => {
    const { user } = open()
    const field = await screen.findByDisplayValue('10.00')

    await user.clear(field)
    await user.type(field, '101')

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', SAVE)).toBeDisabled()
  })

  it('si el servidor lo rechaza, lo avisa', async () => {
    const { api, user } = open()
    api.on('patch', ROUTE, new RespuestaDeError(403, 'Solo el encargado cambia el tope'))
    const field = await screen.findByDisplayValue('10.00')

    await user.clear(field)
    await user.type(field, '5')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Solo el encargado cambia el tope')).toBeInTheDocument()
  })
})
