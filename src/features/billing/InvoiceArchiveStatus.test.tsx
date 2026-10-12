import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { invoice } from '#jest/fixtures/panel'
import { mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { Invoice } from '@/api/types'
import { InvoiceArchiveStatus } from './InvoiceArchiveStatus'

const ARCHIVE = '/billing/invoices/5/archive'
const RETRY = { name: 'Reintentar respaldo' }
const FAILED = { archive_status: 'failed', archive_status_label: 'Falló' } as const

function open(changes: Partial<Invoice>, permissions = PERMISSIONS_OWNER) {
  const api = server()
  signInAs(permissions)
  return { api, ...mountScreen(<InvoiceArchiveStatus invoice={invoice(changes)} />) }
}

describe('InvoiceArchiveStatus', () => {
  it('con el respaldo apagado no muestra nada', () => {
    open({ archive_status: 'disabled' })
    expect(screen.queryByText(/Respaldo/u)).not.toBeInTheDocument()
  })

  it('dice cómo va el respaldo y no ofrece reintentar si no falló', () => {
    open({ archive_status: 'done', archive_status_label: 'Respaldado' })

    expect(screen.getByText('Respaldo: Respaldado')).toBeInTheDocument()
    expect(screen.queryByRole('button', RETRY)).not.toBeInTheDocument()
  })

  it('si falló, «Reintentar respaldo» lo pide de nuevo', async () => {
    const { api, user } = open(FAILED)
    api.on('post', ARCHIVE, invoice({ archive_status: 'pending' }))

    await user.click(screen.getByRole('button', RETRY))

    expect(await screen.findByText('B001-12: respaldo pedido.')).toBeInTheDocument()
    expect(api.calls('post', ARCHIVE)).toHaveLength(1)
  })

  it('solo lo ve quien gestiona la facturación', () => {
    open(FAILED, PERMISSIONS_WAITER)
    expect(screen.queryByText(/Respaldo/u)).not.toBeInTheDocument()
  })
})
