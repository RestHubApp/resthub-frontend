import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { useState } from 'react'

import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { DocumentType } from '@/api/types'
import { CustomerFields } from './CustomerFields'

const STATUS = '/lookup/status'
const RUC = '/lookup/ruc/20100070970'
const SEARCH = { name: 'Buscar en SUNAT/RENIEC' }

function Draft({ documentType }: { readonly documentType: DocumentType }) {
  const [values, setValues] = useState({ number: '', name: '', address: '' })
  return <CustomerFields documentType={documentType} withAddress values={values} onChange={setValues} />
}

function open(enabled: boolean, permissions = PERMISSIONS_OWNER, documentType: DocumentType = 'ruc') {
  const api = server().on('get', STATUS, { enabled })
  signInAs(permissions)
  return { api, ...mountScreen(<Draft documentType={documentType} />) }
}

describe('CustomerFields: buscar en SUNAT/RENIEC', () => {
  it('rellena la razón social y la dirección en campos que siguen editables, y avisa de un RUC no habido', async () => {
    const { api, user } = open(true)
    api.on('get', RUC, { document_type: 'ruc', document_number: '20100070970', name: 'SUPERMERCADOS PERUANOS SA', address: 'AV. ANGAMOS 123', status: 'ACTIVO', condition: 'NO HABIDO' })
    await user.type(screen.getByLabelText('RUC'), '20100070970')

    await user.click(await screen.findByRole('button', SEARCH))

    expect(await screen.findByDisplayValue('SUPERMERCADOS PERUANOS SA')).toBeEnabled()
    expect(screen.getByLabelText('Dirección fiscal (opcional)')).toHaveValue('AV. ANGAMOS 123')
    expect(screen.getByRole('status')).toHaveTextContent('condición NO HABIDO')
    await user.type(screen.getByLabelText('Razón social'), ' EDITADA')
    expect(screen.getByLabelText('Razón social')).toHaveValue('SUPERMERCADOS PERUANOS SA EDITADA')
  })

  it('no llama con un RUC mal escrito y lo dice', async () => {
    const { api, user } = open(true)
    await user.type(screen.getByLabelText('RUC'), '2010')

    expect(await screen.findByRole('button', SEARCH)).toBeDisabled()
    expect(screen.getByText('El RUC tiene 11 dígitos.')).toBeInTheDocument()
    expect(api.calls('get', RUC)).toHaveLength(0)
  })

  it('muestra el mensaje en español según el código del error', async () => {
    const { api, user } = open(true)
    api.on('get', RUC, new ErrorResponse(404, 'x', 'document_not_found'))
    await user.type(screen.getByLabelText('RUC'), '20100070970')

    await user.click(await screen.findByRole('button', SEARCH))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró en SUNAT o RENIEC. Escribe los datos a mano.')
  })

  it('con la búsqueda apagada, sin permiso o con otro documento no ofrece el botón', async () => {
    open(false)
    await screen.findByLabelText('RUC')
    expect(screen.queryByRole('button', SEARCH)).not.toBeInTheDocument()
  })

  it('un mesero sin permiso de comprobantes no ve el botón', async () => {
    open(true, PERMISSIONS_WAITER)
    await screen.findByLabelText('RUC')
    expect(screen.queryByRole('button', SEARCH)).not.toBeInTheDocument()
  })
})
