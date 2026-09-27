import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { CATALOGO, rol, ROL_ENCARGADO, ROL_MESERO } from '#jest/fixtures/plataforma'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor, type Peticion } from '#jest/harness'
import type { PermissionCode, Role } from '../../api/types'
import RolesView from './RolesView'

const ORDERS_TAKE = 'orders.take'
const TOMAR_PEDIDOS = 'Tomar pedidos'

const COCINA = rol()
const GUARDAR = { name: 'Guardar' }

function abrirRoles(permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO, roles: Role[] = [ROL_ENCARGADO, ROL_MESERO, COCINA]) {
  const api = servidor().on('get', '/roles', roles).on('get', '/permissions', CATALOGO)
  entrarComo(permisos)
  return { api, ...montar(<RolesView />, { path: '/roles' }) }
}

function fila(nombre: string): HTMLElement {
  return screen.getByText(nombre, { selector: 'span.text-lg' }).closest('li') as HTMLElement
}

describe('RolesView', () => {
  it('lista los roles con su clase, cuántos lo tienen y qué pueden hacer', async () => {
    abrirRoles()

    expect(await screen.findByText('3 roles')).toBeInTheDocument()
    expect(within(fila('Encargado')).getByText('Fijo')).toBeInTheDocument()
    expect(within(fila('Encargado')).getByText(/Todos los permisos/u)).toBeInTheDocument()
    expect(within(fila('Mesero')).getByText(/3 personas/u)).toBeInTheDocument()
    expect(within(fila('Cocina')).getByText(/Nadie lo tiene/u)).toBeInTheDocument()
  })

  it('el rol del encargado solo se mira y el personalizado vacío se puede borrar', async () => {
    abrirRoles()
    await screen.findByText('3 roles')

    expect(within(fila('Encargado')).getByRole('button', { name: 'Ver permisos del rol Encargado' })).toBeInTheDocument()
    expect(within(fila('Encargado')).queryByRole('button', { name: /Eliminar/u })).not.toBeInTheDocument()
    expect(within(fila('Cocina')).getByRole('button', { name: 'Eliminar el rol Cocina' })).toBeInTheDocument()
    expect(within(fila('Mesero')).queryByRole('button', { name: /Eliminar/u })).not.toBeInTheDocument()
  })

  it('un rol con permisos que la cuenta no tiene no se puede editar', async () => {
    abrirRoles(['roles.manage', ORDERS_TAKE])
    await screen.findByText('3 roles')

    expect(within(fila('Mesero')).getByText('Tiene permisos que tu cuenta no tiene.')).toBeInTheDocument()
    expect(within(fila('Mesero')).getByRole('button', { name: 'Ver permisos del rol Mesero' })).toBeInTheDocument()
    expect(within(fila('Cocina')).getByRole('button', { name: 'Editar el rol Cocina' })).toBeInTheDocument()
  })

  it('crea un rol con el nombre y los permisos marcados', async () => {
    const { api, user } = abrirRoles()
    api.on('post', '/roles', (peticion: Peticion) => rol({ id: 9, ...(peticion.body as Partial<Role>) }))
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const ventana = await screen.findByRole('dialog', { name: 'Nuevo rol' })
    await user.type(within(ventana).getByLabelText('Nombre'), 'Caja')
    await user.click(await within(ventana).findByRole('checkbox', { name: 'Abrir y cerrar la caja' }))
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await screen.findByText('Rol Caja creado.')).toBeInTheDocument()
    expect(api.llamadas('post', '/roles')[0]?.body).toEqual({ name: 'Caja', permissions: ['cash.manage'] })
    expect(screen.queryByRole('dialog', { name: 'Nuevo rol' })).not.toBeInTheDocument()
  })

  it('no deja dar un permiso que la cuenta no tiene', async () => {
    const { user } = abrirRoles(['roles.manage', ORDERS_TAKE])
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const ventana = await screen.findByRole('dialog')

    expect(await within(ventana).findByRole('checkbox', { name: 'Ver el panel BI' })).toBeDisabled()
    expect(within(ventana).getByRole('checkbox', { name: TOMAR_PEDIDOS })).toBeEnabled()
    expect(within(ventana).getAllByText('Tu cuenta no tiene este permiso, así que no puedes darlo.')).toHaveLength(3)
  })

  it('pide el nombre del rol antes de guardar', async () => {
    const { api, user } = abrirRoles()
    await screen.findByText('3 roles')

    await user.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    const ventana = await screen.findByRole('dialog')
    await within(ventana).findByRole('checkbox', { name: TOMAR_PEDIDOS })
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await within(ventana).findByText('Escribe el nombre del rol')).toBeInTheDocument()
    expect(api.llamadas('post', '/roles')).toHaveLength(0)
  })
})

describe('RolesView: edición y borrado', () => {
  it('al editar el mesero conserva su nombre y cambia los permisos', async () => {
    const { api, user } = abrirRoles()
    api.on('put', '/roles/2', (peticion: Peticion) => ({ ...ROL_MESERO, ...(peticion.body as Partial<Role>) }))
    await screen.findByText('3 roles')

    await user.click(within(fila('Mesero')).getByRole('button', { name: 'Editar el rol Mesero' }))
    const ventana = await screen.findByRole('dialog', { name: 'Editar Mesero' })
    expect(within(ventana).getByText('Es el rol base del mesero: su nombre no cambia, sus permisos sí.')).toBeInTheDocument()
    await user.click(await within(ventana).findByRole('checkbox', { name: 'Cobrar pedidos' }))
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await screen.findByText('Rol Mesero guardado.')).toBeInTheDocument()
    expect(api.llamadas('put', '/roles/2')[0]?.body).toEqual({ name: 'Mesero', permissions: [ORDERS_TAKE] })
  })

  it('si el servidor rechaza el cambio, lo dice dentro de la ventana', async () => {
    const { api, user } = abrirRoles()
    api.on('put', '/roles/5', new RespuestaDeError(409, 'Ya hay un rol con ese nombre.'))
    await screen.findByText('3 roles')

    await user.click(within(fila('Cocina')).getByRole('button', { name: 'Editar el rol Cocina' }))
    const ventana = await screen.findByRole('dialog')
    await within(ventana).findByRole('checkbox', { name: TOMAR_PEDIDOS })
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await within(ventana).findByText('Ya hay un rol con ese nombre.')).toBeInTheDocument()
  })

  it('borra un rol vacío después de confirmar', async () => {
    const { api, user } = abrirRoles()
    api.on('delete', '/roles/5', null, 204)
    await screen.findByText('3 roles')

    await user.click(within(fila('Cocina')).getByRole('button', { name: 'Eliminar el rol Cocina' }))
    const aviso = await screen.findByRole('alertdialog', { name: '¿Eliminar el rol Cocina?' })
    await user.click(within(aviso).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('Rol Cocina eliminado.')).toBeInTheDocument()
    expect(api.llamadas('delete', '/roles/5')).toHaveLength(1)
  })

  it('el rol del encargado se abre solo para mirar, sin «Guardar»', async () => {
    const { user } = abrirRoles()
    await screen.findByText('3 roles')

    await user.click(within(fila('Encargado')).getByRole('button', { name: 'Ver permisos del rol Encargado' }))
    const ventana = await screen.findByRole('dialog', { name: 'Encargado' })

    expect(within(ventana).getByText('El encargado siempre tiene todos los permisos y su rol no se cambia.')).toBeInTheDocument()
    expect(await within(ventana).findByRole('checkbox', { name: 'Ver el panel BI' })).toBeChecked()
    expect(within(ventana).queryByRole('button', GUARDAR)).not.toBeInTheDocument()
    await user.click(within(ventana.querySelector('form') as HTMLElement).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog', { name: 'Encargado' })).not.toBeInTheDocument()
  })

  it('si no se pueden leer los roles, lo avisa', async () => {
    servidor().on('get', '/roles', new RespuestaDeError(500, 'Servidor caído')).on('get', '/permissions', CATALOGO)
    entrarComo()
    montar(<RolesView />)

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
  })
})
