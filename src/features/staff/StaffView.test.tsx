import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { TEAM, member, role, ROLE_OWNER, ROLE_WAITER } from '#jest/fixtures/platform'
import { signInAs, handleMount, PERMISSIONS_OWNER, handleFirst, ErrorResponse, server, type Request } from '#jest/harness'
import type { PermissionCode } from '@/api/types'
import { StaffView } from './StaffView'

// Contraseña de prueba, no una credencial real.
const OTHER_TEST_SECRET = 'otra-clave-10'

const NEW_ACCOUNT = 'Nueva cuenta'
const SECRET_SAFE_1 = 'clave-segura-1'
const CREATE_ACCOUNT = 'Crear cuenta'

const ROLES = [ROLE_OWNER, ROLE_WAITER, role()]
const NAME = 'Nombre completo'

type Member = (typeof TEAM)[number]

function openStaff(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  // Como el servidor: lo que se guarda se ve al releer la lista.
  const team = TEAM.map((account) => ({ ...account }))
  const save = (account: Member): Member => {
    const index = team.findIndex((actual) => actual.id === account.id)
    team.splice(index === -1 ? team.length : index, index === -1 ? 0 : 1, account)
    return account
  }
  const api = server()
    .on('get', '/staff', () => ({ items: team.map((account) => ({ ...account })), total: team.length }))
    .on('get', '/roles', ROLES)
  signInAs(permissions)
  return { api, save, ...handleMount(<StaffView />, { path: '/personal' }) }
}

async function rowOf(name: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole('row', { name })
}

describe('StaffView', () => {
  it('lista al equipo con su rol, su estado y la cuenta propia marcada', async () => {
    openStaff()

    expect(await rowOf(/Ana Torres \(tú\)/u)).toBeInTheDocument()
    expect(within(await rowOf(/Luis Quispe/u)).getByText('Activa')).toBeInTheDocument()
    expect(within(await rowOf(/Rosa Mamani/u)).getByText('Inactiva')).toBeInTheDocument()
  })

  it('da de alta una cuenta con el mesero elegido por omisión', async () => {
    const { api, save, user } = openStaff()
    api.on('post', '/staff', (request: Request) => save(member({ id: 10, ...(request.body as object), role_label: 'Mesero' })))
    await rowOf(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NEW_ACCOUNT }))
    const window = await screen.findByRole('dialog', { name: NEW_ACCOUNT })
    expect(await within(window).findByRole('combobox', { name: 'Rol' })).toHaveDisplayValue('Mesero')
    await user.type(within(window).getByLabelText(NAME), 'María 3 Rojas')
    expect(within(window).getByLabelText(NAME)).toHaveValue('María  Rojas')
    await user.clear(within(window).getByLabelText(NAME))
    await user.type(within(window).getByLabelText(NAME), 'María Rojas')
    await user.type(within(window).getByLabelText('Correo'), 'maria@resthub.dev')
    await user.type(within(window).getByLabelText('Contraseña inicial'), SECRET_SAFE_1)
    await user.click(within(window).getByRole('button', { name: CREATE_ACCOUNT }))

    expect(await rowOf(/María Rojas/u)).toBeInTheDocument()
    expect(api.calls('post', '/staff')[0]?.body).toEqual({
      full_name: 'María Rojas',
      email: 'maria@resthub.dev',
      role_id: 2,
      password: SECRET_SAFE_1,
    })
    expect(screen.queryByRole('dialog', { name: NEW_ACCOUNT })).not.toBeInTheDocument()
  })

  it('si el correo ya existe, el alta muestra el motivo', async () => {
    const { api, user } = openStaff()
    api.on('post', '/staff', new ErrorResponse(409, 'Ya hay una cuenta con ese correo.'))
    await rowOf(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NEW_ACCOUNT }))
    const window = await screen.findByRole('dialog')
    await user.type(await within(window).findByLabelText(NAME), 'Luis Quispe')
    await user.type(within(window).getByLabelText('Correo'), 'luis@resthub.dev')
    await user.type(within(window).getByLabelText('Contraseña inicial'), SECRET_SAFE_1)
    await user.click(within(window).getByRole('button', { name: CREATE_ACCOUNT }))

    expect(await within(window).findByText('Ya hay una cuenta con ese correo.')).toBeInTheDocument()
  })

  it('la cuenta propia cambia el nombre pero no el rol, ni se desactiva', async () => {
    const { api, save, user } = openStaff()
    api.on('patch', '/staff/7', (request: Request) => save({ ...handleFirst(TEAM), ...(request.body as object) }))
    const own = await rowOf(/Ana Torres/u)

    expect(within(own).queryByRole('button', { name: 'Contraseña' })).not.toBeInTheDocument()
    expect(within(own).getByRole('button', { name: 'Desactivar' })).toBeDisabled()
    await user.click(within(own).getByRole('button', { name: 'Editar' }))
    const window = await screen.findByRole('dialog', { name: 'Editar a Ana Torres' })
    expect(await within(window).findByText('No puedes cambiar el rol de tu propia cuenta.')).toBeInTheDocument()
    await user.type(within(window).getByLabelText(NAME), ' Luna')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await rowOf(/Ana Torres Luna/u)).toBeInTheDocument()
    expect(api.calls('patch', '/staff/7')[0]?.body).toEqual({ full_name: 'Ana Torres Luna' })
  })
})

describe('StaffView: cambios sobre otras cuentas', () => {
  it('cambia el rol de otra cuenta', async () => {
    const { api, save, user } = openStaff()
    api.on('patch', '/staff/8', () => save(member({ role_id: 5, role_label: 'Cocina' })))

    await user.click(within(await rowOf(/Luis Quispe/u)).getByRole('button', { name: 'Editar' }))
    const window = await screen.findByRole('dialog', { name: 'Editar a Luis Quispe' })
    await user.selectOptions(await within(window).findByRole('combobox', { name: 'Rol' }), 'Cocina')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await within(await rowOf(/Luis Quispe/u)).findByText('Cocina')).toBeInTheDocument()
    expect(api.calls('patch', '/staff/8')[0]?.body).toEqual({ full_name: 'Luis Quispe', role_id: 5 })
  })

  it('restablece la contraseña de otra cuenta y lo avisa', async () => {
    const { api, user } = openStaff()
    api.on('post', '/staff/8/password', null, 204)

    await user.click(within(await rowOf(/Luis Quispe/u)).getByRole('button', { name: 'Contraseña' }))
    const window = await screen.findByRole('dialog', { name: 'Restablecer la contraseña de Luis Quispe' })
    await user.type(within(window).getByLabelText('Nueva contraseña'), OTHER_TEST_SECRET)
    await user.click(within(window).getByRole('button', { name: 'Restablecer' }))

    expect(await screen.findByText('Contraseña de Luis Quispe restablecida.')).toBeInTheDocument()
    expect(api.calls('post', '/staff/8/password')[0]?.body).toEqual({ new_password: OTHER_TEST_SECRET })
  })

  it('desactivar se confirma; activar va directo', async () => {
    const { api, save, user } = openStaff()
    api.on('patch', '/staff/8/status', () => save(member({ is_active: false })))
    api.on('patch', '/staff/9/status', () => save({ ...(TEAM.at(2) ?? handleFirst(TEAM)), is_active: true }))

    await user.click(within(await rowOf(/Luis Quispe/u)).getByRole('button', { name: 'Desactivar' }))
    const notice = await screen.findByRole('alertdialog', { name: '¿Desactivar a Luis Quispe?' })
    await user.click(within(notice).getByRole('button', { name: 'Desactivar' }))
    await user.click(within(await rowOf(/Rosa Mamani/u)).getByRole('button', { name: 'Activar' }))

    expect(api.calls('patch', '/staff/8/status')[0]?.body).toEqual({ is_active: false })
    expect(api.calls('patch', '/staff/9/status')[0]?.body).toEqual({ is_active: true })
    expect(await within(await rowOf(/Rosa Mamani/u)).findByText('Activa')).toBeInTheDocument()
  })

  it('no ofrece cambiar una cuenta cuyo rol tiene permisos que quien mira no tiene', async () => {
    openStaff(['staff.manage', 'orders.take', 'orders.charge'])

    const owner = await rowOf(/Ana Torres/u)
    expect(await within(owner).findByText('Su rol tiene permisos que tu cuenta no tiene: no puedes cambiarla.')).toBeInTheDocument()
    expect(within(await rowOf(/Luis Quispe/u)).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })

  it('si no hay ningún rol que la cuenta pueda dar, el alta lo explica', async () => {
    const { user } = openStaff(['staff.manage'])
    await rowOf(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NEW_ACCOUNT }))

    expect(await screen.findByText('Todos los roles tienen permisos que tu cuenta no tiene, así que no puedes dar ninguno.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CREATE_ACCOUNT })).not.toBeInTheDocument()
  })

  it('si no se puede cargar el personal, lo dice', async () => {
    server().on('get', '/staff', new ErrorResponse(500, 'Sin conexión con la base')).on('get', '/roles', ROLES)
    signInAs()
    handleMount(<StaffView />)

    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
  })
})
