import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { ErrorResponse, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { FakePasswordChangeView } from '#jest/passwordChangeView'
import { send } from '@/api/client'
import { useSession } from '@/store/session'
import { TemporaryPasswordGate } from './TemporaryPasswordGate'

const CONTENT = 'Pedidos del salón'

/** Como en el armazón: la cuenta sale del almacén de sesión. */
function Gate() {
  const account = useSession((state) => state.account)
  return account === null ? null : <TemporaryPasswordGate account={account} view={FakePasswordChangeView}><p>{CONTENT}</p></TemporaryPasswordGate>
}

describe('contraseña temporal (RFS-20)', () => {
  it('con la contraseña temporal solo se ve el cambio', async () => {
    server()
    signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    mountScreen(<Gate />)

    expect(await screen.findByRole('heading', { name: 'Cambia tu contraseña, Ana Torres' })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
  })

  it('la vista previa nunca la pide', () => {
    server()
    signInAs(PERMISSIONS_WAITER, { must_change_password: true, preview: true })
    mountScreen(<Gate />)

    expect(screen.getByText(CONTENT)).toBeInTheDocument()
  })

  it('un 403 password_change_required de cualquier petición lleva al cambio', async () => {
    server().on('get', '/tables', new ErrorResponse(403, 'Cambia la contraseña temporal antes de seguir.', 'password_change_required'))
    signInAs(PERMISSIONS_WAITER)
    mountScreen(<Gate />)
    expect(screen.getByText(CONTENT)).toBeInTheDocument()

    await expect(send((client) => client.GET('/api/v1/tables'))).rejects.toMatchObject({ code: 'password_change_required' })

    await waitFor(() => {
      expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
    })
    expect(useSession.getState().token).not.toBeNull()
  })
})
