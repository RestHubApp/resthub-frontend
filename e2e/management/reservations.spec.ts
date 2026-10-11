// HU38: las reservas por día. Nombre, teléfono, personas, día, hora,
// duración y mesa opcional; dos reservas vigentes de la misma mesa no se
// cruzan; estados reservada, llegaron, no vinieron y cancelada.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, dayFromToday, failureServer } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-23 el encargado toma reservas de otro día, el servidor no deja cruzar la misma mesa, corrige una y marca llegaron, no vinieron y cancelada', async ({ page, local }) => {
  covers(
    'ruta:/reservas',
    'dialogo:reservations/ReservationDialog',
    'funcion:reservas.crear',
    'funcion:reservas.cruce-de-mesa',
    'funcion:reservas.editar',
    'funcion:reservas.llegaron',
    'funcion:reservas.no-vinieron',
    'funcion:reservas.cancelar',
    'funcion:reservas.cambiar-dia',
    'estado:reservas.vacio',
    'estado:reservas.error',
  )
  // Las reservas son de mañana: una reserva de hoy a las 20:00 ya podría haber pasado.
  const manana = dayFromToday(1)
  await api(local).post('/reservations', {
    customer_name: 'Grupo Vargas',
    phone: '',
    party_size: 6,
    reserved_for: `${manana}T13:00:00-05:00`,
    duration_minutes: 90,
    table_id: null,
    notes: '',
  })
  await openAs(page, local.owner, '/reservas')
  await expect(page.getByRole('heading', { level: 1, name: 'Reservas' })).toBeVisible()
  await expect(page.getByText('No hay reservas para este día')).toBeVisible()
  await page.getByRole('main').getByLabel('Día', { exact: true }).fill(manana)
  const group = page.getByRole('listitem').filter({ hasText: 'Grupo Vargas' })
  await expect(group).toContainText('6 personas · sin mesa')
  await expect(group).toContainText('Reservada')

  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  const registration = page.getByRole('dialog', { name: 'Nueva reserva' })
  await expect(registration.getByLabel('Día', { exact: true })).toHaveValue(manana)
  await expect(registration.getByLabel('Personas')).toHaveValue('2')
  await registration.getByLabel('Personas').fill('0')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByText('Escribe a nombre de quién')).toBeVisible()
  await expect(registration.getByText('Entre 1 y 50')).toBeVisible()
  await registration.getByLabel('A nombre de').fill('Familia Quispe')
  await registration.getByLabel('Teléfono (opcional)').fill('987111222')
  await registration.getByLabel('Personas').fill('4')
  await registration.getByLabel('Hora').fill('20:00')
  await registration.getByLabel('Mesa (opcional)').selectOption({ label: 'Mesa 2' })
  await registration.getByLabel('Notas (opcional)').fill('Cumpleaños')
  await evidence(page, 'ges-23-1-nueva-reserva')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Reserva de Familia Quispe guardada.')).toBeVisible()
  const quispe = page.getByRole('listitem').filter({ hasText: 'Familia Quispe' })
  await expect(quispe).toContainText('4 personas · Mesa 2 · 987111222 · Cumpleaños')

  // La misma mesa, una hora después, choca con la reserva de las 20:00.
  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  await registration.getByLabel('A nombre de').fill('Señor Torres')
  // La ventana conserva lo de la reserva anterior (HALLAZGO-gestion-2): se reescriben los campos.
  await registration.getByLabel('Teléfono (opcional)').fill('')
  await registration.getByLabel('Personas').fill('2')
  await registration.getByLabel('Notas (opcional)').fill('')
  await registration.getByLabel('Hora').fill('21:00')
  await registration.getByLabel('Mesa (opcional)').selectOption({ label: 'Mesa 2' })
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByRole('alert')).toBeVisible()
  await evidence(page, 'ges-23-2-cruce-de-mesa')
  await registration.getByLabel('Mesa (opcional)').selectOption({ label: 'Mesa 3' })
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Reserva de Señor Torres guardada.')).toBeVisible()
  const torres = page.getByRole('listitem').filter({ hasText: 'Señor Torres' })
  await expect(torres).toContainText('2 personas · Mesa 3')

  await quispe.getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('dialog', { name: 'Reserva de Familia Quispe' })
  await expect(edit.getByLabel('Hora')).toHaveValue('20:00')
  await edit.getByLabel('Personas').fill('5')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Reserva de Familia Quispe guardada.')).toBeVisible()
  await expect(quispe).toContainText('5 personas · Mesa 2')

  // Llegaron, no vinieron, cancelada: ya no se ofrecen acciones.
  await quispe.getByRole('button', { name: 'Llegaron' }).click()
  await expect(notice(page, 'Familia Quispe: Llegaron.')).toBeVisible()
  await expect(quispe.getByRole('button')).toHaveCount(0)
  await torres.getByRole('button', { name: 'No vinieron' }).click()
  await expect(notice(page, 'Señor Torres: No vinieron.')).toBeVisible()
  await group.getByRole('button', { name: 'Cancelar' }).click()
  await expect(group).toContainText('Cancelada')
  await evidence(page, 'ges-23-3-estados')
  const statuses = (await api(local).list(`/reservations?day=${manana}`)).map((r) => [r.customer_name, r.status])
  expect(Object.fromEntries(statuses)).toEqual({ 'Grupo Vargas': 'cancelled', 'Familia Quispe': 'seated', 'Señor Torres': 'no_show' })

  // Otro día, sin reservas.
  await page.getByRole('main').getByLabel('Día', { exact: true }).fill(dayFromToday(2))
  await expect(page.getByText('No hay reservas para este día')).toBeVisible()

  await failureServer(page, '/reservations')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('GES-24 la ventana de una reserva nueva abre vacía después de guardar otra', async ({ page, local }) => {
  await openAs(page, local.owner, '/reservas')
  await page.getByRole('main').getByLabel('Día', { exact: true }).fill(dayFromToday(1))
  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  const registration = page.getByRole('dialog', { name: 'Nueva reserva' })
  await registration.getByLabel('A nombre de').fill('Familia Quispe')
  await registration.getByLabel('Teléfono (opcional)').fill('987111222')
  await registration.getByLabel('Personas').fill('4')
  await registration.getByLabel('Notas (opcional)').fill('Cumpleaños')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Reserva de Familia Quispe guardada.')).toBeVisible()
  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  await evidence(page, 'ges-24-1-reserva-nueva-vacia')
  await expect(registration.getByLabel('A nombre de')).toHaveValue('')
  await expect(registration.getByLabel('Teléfono (opcional)')).toHaveValue('')
  await expect(registration.getByLabel('Personas')).toHaveValue('2')
  await expect(registration.getByLabel('Notas (opcional)')).toHaveValue('')
})
