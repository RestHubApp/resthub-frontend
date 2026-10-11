// Revisión breve de navegación con teclado (lo que las herramientas
// automáticas no miden): recorre con Tab unas pantallas, anota a dónde va el
// foco y si se ve, y comprueba que un diálogo atrapa el foco, se cierra con
// Escape y devuelve el foco al botón que lo abrió. Deja capturas del foco.
import { join } from 'node:path'

import { openStatus, ensureDir, contextOf, writeJson, launch, REPORTS } from './comun.mjs'
import { STATUSES } from './inventario.mjs'

const dir = await ensureDir(join(REPORTS, 'teclado'))
const status = (id) => STATUSES.find((e) => e.id === id)

/** Lo que tiene el foco: rol, nombre y si su anillo de foco se ve. */
function focus(page) {
  return page.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return { nombre: '(body)' }
    const style = getComputedStyle(e)
    const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const shadow = style.boxShadow !== 'none'
    const name = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('title') || e.getAttribute('placeholder') || '').trim().replace(/\s+/gu, ' ').slice(0, 60)
    const r = e.getBoundingClientRect()
    return { etiqueta: e.tagName.toLowerCase(), rol: e.getAttribute('role'), nombre: name, visible: ring || shadow, dentroDeDialogo: Boolean(e.closest('[role="dialog"],[role="alertdialog"]')), alto: Math.round(r.height), ancho: Math.round(r.width) }
  })
}

async function traverse(browser, id, vista, tabs) {
  const context = await browser.newContext(contextOf(vista))
  const page = await openStatus(browser, context, status(id))
  // El recorrido empieza desde el principio del documento, como al cargar.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.getSelection()?.removeAllRanges()
  })
  const steps = []
  for (let i = 0; i < tabs; i += 1) {
    await page.keyboard.press('Tab')
    steps.push(await focus(page))
    if (i === 0 || i === 3) await page.screenshot({ path: join(dir, `${id}--${vista}--tab${String(i + 1)}.png`) })
  }
  await context.close()
  return { id, vista, pasos: steps }
}

async function dialog(browser, id, trigger, vista) {
  const context = await browser.newContext(contextOf(vista))
  const e = status(id)
  const page = await openStatus(browser, context, { ...e, clase: 'ruta', espera: undefined, pasos: [] })
  const button = page.getByRole('button', { name: trigger, exact: true }).first()
  await button.focus()
  await page.keyboard.press('Enter')
  await page.waitForSelector('[role="dialog"],[role="alertdialog"]', { state: 'visible' })
  await page.waitForTimeout(400)
  const onOpen = await focus(page)
  const path = []
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab')
    path.push(await focus(page))
  }
  await page.screenshot({ path: join(dir, `${id}--${vista}--dialogo.png`) })
  await page.keyboard.press('Escape')
  // La animación de salida deja el diálogo en el DOM un momento; con la
  // máquina cargada puede pasar del segundo.
  const closed = await page
    .waitForFunction(() => !document.querySelector('[role="dialog"],[role="alertdialog"]'), null, { timeout: 5000 })
    .then(() => true, () => false)
  const onClose = await focus(page)
  await context.close()
  return {
    id, vista, disparador: trigger, alAbrir: onOpen,
    focoAtrapado: path.every((p) => p.dentroDeDialogo),
    anilloVisible: path.filter((p) => !p.visible).map((p) => p.nombre),
    cerradoConEscape: closed,
    focoDevuelto: onClose.nombre.includes(trigger),
    alCerrar: onClose,
  }
}

const browserValue = await launch()
const result = {
  recorridos: [
    await traverse(browserValue, 'acceso', 'escritorio', 6),
    await traverse(browserValue, 'pedidos', 'movil', 10),
    await traverse(browserValue, 'pedidos-nuevo', 'movil', 12),
    await traverse(browserValue, 'tablero', 'escritorio', 12),
  ],
  dialogos: [
    await dialog(browserValue, 'o-cobro', 'Cobrar', 'escritorio'),
    await dialog(browserValue, 'o-nueva-mesa', 'Nueva mesa', 'escritorio'),
    await dialog(browserValue, 'o-llevar', 'Para llevar / Delivery', 'movil'),
    await dialog(browserValue, 'o-desactivar-cuenta', 'Desactivar', 'escritorio'),
  ],
}
await browserValue.close()
await writeJson(join(dir, 'teclado.json'), result)
for (const r of result.recorridos) {
  console.log(`\n${r.id} (${r.vista}): ${r.pasos.map((p, i) => `${String(i + 1)}. ${p.nombre}${p.visible ? '' : ' [sin anillo]'}`).join(' → ')}`)
}
for (const d of result.dialogos) {
  console.log(`\nDiálogo «${d.disparador}» en ${d.id} (${d.vista}): foco inicial en «${d.alAbrir.nombre}», atrapado ${d.focoAtrapado ? 'sí' : 'NO'}, anillo ausente en [${d.anilloVisible.join(', ')}], Escape cierra ${d.cerradoConEscape ? 'sí' : 'NO'}, foco devuelto ${d.focoDevuelto ? 'sí' : 'NO'} («${d.alCerrar.nombre}»)`)
}
