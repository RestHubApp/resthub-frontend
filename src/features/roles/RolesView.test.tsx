import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { CATALOG, role, ROLE_OWNER, ROLE_WAITER } from '#jest/fixtures/platform'
import { signInAs, mountScreen, PERMISSIONS_OWNER, ErrorResponse, server, type Request } from '#jest/harness'
import type { PermissionCode, Role } from '@/api/types'
import { RolesView } from './RolesView'

const ORDERS_TAKE = 'orders.take'
const TAKE_ORDERS = 'Tomar pedidos'

const KITCHEN = role()
const SAVE = { name: 'Guardar' }

function openRoles(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER, roles: Role[] = [ROLE_OWNER, ROLE_WAITER, KITCHEN]) {
  const api = server().on('get', '/roles', roles).on('get', '/permissions', CATALOG)
  signInAs(permissions)
  return { api, ...mountScreen(<RolesView />, { path: '/roles' }) }
}

function row(name: string): HTMLElement {
  return screen.getByText(name, { selector: 'span.text-lg' }).closest('li') as HTMLElement
}

describe('RolesView', () => {
  it('lista los roles con su clase, cuántos lo tienen y qué pueden hacer', async () => {
    openRoles()

    expect(await screen.findByText('3 roles')).toBeInTheDocument()
    expect(within(row('Encargado')).getByText('Fijo')).toBeInTheDocument()
    expect(within(row('Encargado')).getByText(/Todos los permisos/u)).toBeInTheDocument()
    expect(within(row('Mesero')).getByText(/3 personas/u)).toBeInTheDocument()
    expect(within(row('Cocina')).getByText(/Nadie lo tiene/u)).toBeInTheDocument()
  })

  it('el rol del encargado solo se mira y el personalizado vacío se puede borrar', async () => {
    openRoles()
    await screen.findByText('3 roles')

    expect(within(row('Encargado')).getByRole('button', { name: 'Ver permisos del rol Encargado' })).toBeInTheDocument()
    expect(within(row('Encargado')).queryByRole('button', { name: /Eliminar/u })).not.toBeInTheDocument()
    expect(within(row('Cocina')).getByRole('button', { name: 'Eliminar el rol Cocina' })).toBeInTheDocument()
    expect(within(row('Mesero')).queryByRole('button', { name: /Eliminar/u })).not.toBeInTheDocument()
  })

  it('un rol con permisos que la cuenta no tiene no se puede editar', async () => {
    openRoles(['roles.manage', ORDERS_TAKE])
    await screen.findByText('3 roles')

    expect(within(row('Mesero')).getByText('Tiene permisos que tu cuenta no tiene.')).toBeInTheDocument()
    expect(within(row('Mesero')).getByRole('button', { name: 'Ver permisos del rol Mesero' })).toBeInTheDocument()
    expect(within(row('Cocina')).getByRole('button', { name: 'Editar el rol Cocina' })).toBeInTheDocument()
  })

  it('crea un rol con el nombre y los permisos marcados', async () => {
    const { api, user } = openRoles()
    api.on('post', '/roles', (request: Request) => role({ id: 9, ...(request.body as Partial<Role>) }))
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const window = await screen.findByRole('dialog', { name: 'Nuevo rol' })
    await user.type(within(window).getByLabelText('Nombre'), 'Caja')
    await user.click(await within(window).findByRole('checkbox', { name: 'Abrir y cerrar la caja' }))
    await user.click(within(window).getByRole('button', SAVE))

    expect(await screen.findByText('Rol Caja creado.')).toBeInTheDocument()
    expect(api.calls('post', '/roles')[0]?.body).toEqual({ name: 'Caja', permissions: ['cash.manage'] })
    expect(screen.queryByRole('dialog', { name: 'Nuevo rol' })).not.toBeInTheDocument()
  })

  it('no deja dar un permiso que la cuenta no tiene', async () => {
    const { user } = openRoles(['roles.manage', ORDERS_TAKE])
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const window = await screen.findByRole('dialog')

    expect(await within(window).findByRole('checkbox', { name: 'Ver el panel BI' })).toBeDisabled()
    expect(within(window).getByRole('checkbox', { name: TAKE_ORDERS })).toBeEnabled()
    expect(within(window).getAllByText('Tu cuenta no tiene este permiso, así que no puedes darlo.')).toHaveLength(3)
  })

  it('pide el nombre del rol antes de guardar', async () => {
    const { api, user } = openRoles()
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const window = await screen.findByRole('dialog')
    await within(window).findByRole('checkbox', { name: TAKE_ORDERS })
    await user.click(within(window).getByRole('button', SAVE))

    expect(await within(window).findByText('Escribe el nombre del rol')).toBeInTheDocument()
    expect(api.calls('post', '/roles')).toHaveLength(0)
  })
})

describe('RolesView: edición y borrado', () => {
  it('al editar el mesero conserva su nombre y cambia los permisos', async () => {
    const { api, user } = openRoles()
    api.on('put', '/roles/2', (request: Request) => ({ ...ROLE_WAITER, ...(request.body as Partial<Role>) }))
    await screen.findByText('3 roles')

    await user.click(within(row('Mesero')).getByRole('button', { name: 'Editar el rol Mesero' }))
    const window = await screen.findByRole('dialog', { name: 'Editar Mesero' })
    expect(within(window).getByText('Es el rol base del mesero: su nombre no cambia, sus permisos sí.')).toBeInTheDocument()
    await user.click(await within(window).findByRole('checkbox', { name: 'Cobrar pedidos' }))
    await user.click(within(window).getByRole('button', SAVE))

    expect(await screen.findByText('Rol Mesero guardado.')).toBeInTheDocument()
    expect(api.calls('put', '/roles/2')[0]?.body).toEqual({ name: 'Mesero', permissions: [ORDERS_TAKE] })
  })

  it('si el servidor rechaza el cambio, lo dice dentro de la ventana', async () => {
    const { api, user } = openRoles()
    api.on('put', '/roles/5', new ErrorResponse(409, 'Ya hay un rol con ese nombre.'))
    await screen.findByText('3 roles')

    await user.click(within(row('Cocina')).getByRole('button', { name: 'Editar el rol Cocina' }))
    const window = await screen.findByRole('dialog')
    await within(window).findByRole('checkbox', { name: TAKE_ORDERS })
    await user.click(within(window).getByRole('button', SAVE))

    expect(await within(window).findByText('Ya hay un rol con ese nombre.')).toBeInTheDocument()
  })

  it('borra un rol vacío después de confirmar', async () => {
    const { api, user } = openRoles()
    api.on('delete', '/roles/5', null, 204)
    await screen.findByText('3 roles')

    await user.click(within(row('Cocina')).getByRole('button', { name: 'Eliminar el rol Cocina' }))
    const notice = await screen.findByRole('alertdialog', { name: '¿Eliminar el rol Cocina?' })
    await user.click(within(notice).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('Rol Cocina eliminado.')).toBeInTheDocument()
    expect(api.calls('delete', '/roles/5')).toHaveLength(1)
  })

  it('el rol del encargado se abre solo para mirar, sin «Guardar»', async () => {
    const { user } = openRoles()
    await screen.findByText('3 roles')

    await user.click(within(row('Encargado')).getByRole('button', { name: 'Ver permisos del rol Encargado' }))
    const window = await screen.findByRole('dialog', { name: 'Encargado' })

    expect(within(window).getByText('El encargado siempre tiene todos los permisos y su rol no se cambia.')).toBeInTheDocument()
    expect(await within(window).findByRole('checkbox', { name: 'Ver el panel BI' })).toBeChecked()
    expect(within(window).queryByRole('button', SAVE)).not.toBeInTheDocument()
    await user.click(within(window.querySelector('form') as HTMLElement).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog', { name: 'Encargado' })).not.toBeInTheDocument()
  })

  it('si no se pueden leer los roles, lo avisa', async () => {
    server().on('get', '/roles', new ErrorResponse(500, 'Servidor caído')).on('get', '/permissions', CATALOG)
    signInAs()
    mountScreen(<RolesView />)

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
  })
})
