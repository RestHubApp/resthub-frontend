import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { EQUIPO, miembro, rol, ROL_ENCARGADO, ROL_MESERO } from '#jest/fixtures/plataforma'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor, type Peticion } from '#jest/harness'
import type { PermissionCode } from '../../api/types'
import StaffView from './StaffView'

// Contraseña de prueba, no una credencial real.
const OTRA_CLAVE_DE_PRUEBA = 'otra-clave-10'

const NUEVA_CUENTA = 'Nueva cuenta'
const CLAVE_SEGURA_1 = 'clave-segura-1'
const CREAR_CUENTA = 'Crear cuenta'

const ROLES = [ROL_ENCARGADO, ROL_MESERO, rol()]
const NOMBRE = 'Nombre completo'

type Miembro = (typeof EQUIPO)[number]

function abrirPersonal(permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO) {
  // Como el servidor: lo que se guarda se ve al releer la lista.
  const equipo = EQUIPO.map((cuenta) => ({ ...cuenta }))
  const guardar = (cuenta: Miembro): Miembro => {
    const indice = equipo.findIndex((actual) => actual.id === cuenta.id)
    equipo.splice(indice === -1 ? equipo.length : indice, indice === -1 ? 0 : 1, cuenta)
    return cuenta
  }
  const api = servidor()
    .on('get', '/staff', () => ({ items: equipo.map((cuenta) => ({ ...cuenta })), total: equipo.length }))
    .on('get', '/roles', ROLES)
  entrarComo(permisos)
  return { api, guardar, ...montar(<StaffView />, { path: '/personal' }) }
}

async function filaDe(nombre: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole('row', { name: nombre })
}

describe('StaffView', () => {
  it('lista al equipo con su rol, su estado y la cuenta propia marcada', async () => {
    abrirPersonal()

    expect(await filaDe(/Ana Torres \(tú\)/u)).toBeInTheDocument()
    expect(within(await filaDe(/Luis Quispe/u)).getByText('Activa')).toBeInTheDocument()
    expect(within(await filaDe(/Rosa Mamani/u)).getByText('Inactiva')).toBeInTheDocument()
  })

  it('da de alta una cuenta con el mesero elegido por omisión', async () => {
    const { api, guardar, user } = abrirPersonal()
    api.on('post', '/staff', (peticion: Peticion) => guardar(miembro({ id: 10, ...(peticion.body as object), role_label: 'Mesero' })))
    await filaDe(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NUEVA_CUENTA }))
    const ventana = await screen.findByRole('dialog', { name: NUEVA_CUENTA })
    expect(await within(ventana).findByRole('combobox', { name: 'Rol' })).toHaveDisplayValue('Mesero')
    await user.type(within(ventana).getByLabelText(NOMBRE), 'María 3 Rojas')
    expect(within(ventana).getByLabelText(NOMBRE)).toHaveValue('María  Rojas')
    await user.clear(within(ventana).getByLabelText(NOMBRE))
    await user.type(within(ventana).getByLabelText(NOMBRE), 'María Rojas')
    await user.type(within(ventana).getByLabelText('Correo'), 'maria@resthub.dev')
    await user.type(within(ventana).getByLabelText('Contraseña inicial'), CLAVE_SEGURA_1)
    await user.click(within(ventana).getByRole('button', { name: CREAR_CUENTA }))

    expect(await filaDe(/María Rojas/u)).toBeInTheDocument()
    expect(api.llamadas('post', '/staff')[0]?.body).toEqual({
      full_name: 'María Rojas',
      email: 'maria@resthub.dev',
      role_id: 2,
      password: CLAVE_SEGURA_1,
    })
    expect(screen.queryByRole('dialog', { name: NUEVA_CUENTA })).not.toBeInTheDocument()
  })

  it('si el correo ya existe, el alta muestra el motivo', async () => {
    const { api, user } = abrirPersonal()
    api.on('post', '/staff', new RespuestaDeError(409, 'Ya hay una cuenta con ese correo.'))
    await filaDe(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NUEVA_CUENTA }))
    const ventana = await screen.findByRole('dialog')
    await user.type(await within(ventana).findByLabelText(NOMBRE), 'Luis Quispe')
    await user.type(within(ventana).getByLabelText('Correo'), 'luis@resthub.dev')
    await user.type(within(ventana).getByLabelText('Contraseña inicial'), CLAVE_SEGURA_1)
    await user.click(within(ventana).getByRole('button', { name: CREAR_CUENTA }))

    expect(await within(ventana).findByText('Ya hay una cuenta con ese correo.')).toBeInTheDocument()
  })

  it('la cuenta propia cambia el nombre pero no el rol, ni se desactiva', async () => {
    const { api, guardar, user } = abrirPersonal()
    api.on('patch', '/staff/7', (peticion: Peticion) => guardar({ ...(EQUIPO[0]), ...(peticion.body as object) }))
    const propia = await filaDe(/Ana Torres/u)

    expect(within(propia).queryByRole('button', { name: 'Contraseña' })).not.toBeInTheDocument()
    expect(within(propia).getByRole('button', { name: 'Desactivar' })).toBeDisabled()
    await user.click(within(propia).getByRole('button', { name: 'Editar' }))
    const ventana = await screen.findByRole('dialog', { name: 'Editar a Ana Torres' })
    expect(await within(ventana).findByText('No puedes cambiar el rol de tu propia cuenta.')).toBeInTheDocument()
    await user.type(within(ventana).getByLabelText(NOMBRE), ' Luna')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await filaDe(/Ana Torres Luna/u)).toBeInTheDocument()
    expect(api.llamadas('patch', '/staff/7')[0]?.body).toEqual({ full_name: 'Ana Torres Luna' })
  })
})

describe('StaffView: cambios sobre otras cuentas', () => {
  it('cambia el rol de otra cuenta', async () => {
    const { api, guardar, user } = abrirPersonal()
    api.on('patch', '/staff/8', () => guardar(miembro({ role_id: 5, role_label: 'Cocina' })))

    await user.click(within(await filaDe(/Luis Quispe/u)).getByRole('button', { name: 'Editar' }))
    const ventana = await screen.findByRole('dialog', { name: 'Editar a Luis Quispe' })
    await user.selectOptions(await within(ventana).findByRole('combobox', { name: 'Rol' }), 'Cocina')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await within(await filaDe(/Luis Quispe/u)).findByText('Cocina')).toBeInTheDocument()
    expect(api.llamadas('patch', '/staff/8')[0]?.body).toEqual({ full_name: 'Luis Quispe', role_id: 5 })
  })

  it('restablece la contraseña de otra cuenta y lo avisa', async () => {
    const { api, user } = abrirPersonal()
    api.on('post', '/staff/8/password', null, 204)

    await user.click(within(await filaDe(/Luis Quispe/u)).getByRole('button', { name: 'Contraseña' }))
    const ventana = await screen.findByRole('dialog', { name: 'Restablecer la contraseña de Luis Quispe' })
    await user.type(within(ventana).getByLabelText('Nueva contraseña'), OTRA_CLAVE_DE_PRUEBA)
    await user.click(within(ventana).getByRole('button', { name: 'Restablecer' }))

    expect(await screen.findByText('Contraseña de Luis Quispe restablecida.')).toBeInTheDocument()
    expect(api.llamadas('post', '/staff/8/password')[0]?.body).toEqual({ new_password: OTRA_CLAVE_DE_PRUEBA })
  })

  it('desactivar se confirma; activar va directo', async () => {
    const { api, guardar, user } = abrirPersonal()
    api.on('patch', '/staff/8/status', () => guardar(miembro({ is_active: false })))
    api.on('patch', '/staff/9/status', () => guardar({ ...(EQUIPO[2]), is_active: true }))

    await user.click(within(await filaDe(/Luis Quispe/u)).getByRole('button', { name: 'Desactivar' }))
    const aviso = await screen.findByRole('alertdialog', { name: '¿Desactivar a Luis Quispe?' })
    await user.click(within(aviso).getByRole('button', { name: 'Desactivar' }))
    await user.click(within(await filaDe(/Rosa Mamani/u)).getByRole('button', { name: 'Activar' }))

    expect(api.llamadas('patch', '/staff/8/status')[0]?.body).toEqual({ is_active: false })
    expect(api.llamadas('patch', '/staff/9/status')[0]?.body).toEqual({ is_active: true })
    expect(await within(await filaDe(/Rosa Mamani/u)).findByText('Activa')).toBeInTheDocument()
  })

  it('no ofrece cambiar una cuenta cuyo rol tiene permisos que quien mira no tiene', async () => {
    abrirPersonal(['staff.manage', 'orders.take', 'orders.charge'])

    const encargada = await filaDe(/Ana Torres/u)
    expect(await within(encargada).findByText('Su rol tiene permisos que tu cuenta no tiene: no puedes cambiarla.')).toBeInTheDocument()
    expect(within(await filaDe(/Luis Quispe/u)).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })

  it('si no hay ningún rol que la cuenta pueda dar, el alta lo explica', async () => {
    const { user } = abrirPersonal(['staff.manage'])
    await filaDe(/Luis Quispe/u)

    await user.click(screen.getByRole('button', { name: NUEVA_CUENTA }))

    expect(await screen.findByText('Todos los roles tienen permisos que tu cuenta no tiene, así que no puedes dar ninguno.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CREAR_CUENTA })).not.toBeInTheDocument()
  })

  it('si no se puede cargar el personal, lo dice', async () => {
    servidor().on('get', '/staff', new RespuestaDeError(500, 'Sin conexión con la base')).on('get', '/roles', ROLES)
    entrarComo()
    montar(<StaffView />)

    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
  })
})
