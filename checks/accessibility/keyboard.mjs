// Revisión breve de navegación con teclado (lo que las herramientas
// automáticas no miden): recorre con Tab unas pantallas, anota a dónde va el
// foco y si se ve, y comprueba que un diálogo atrapa el foco, se cierra con
// Escape y devuelve el foco al botón que lo abrió. Deja capturas del foco.
import { join } from 'node:path'

import { openStatus, ensureDir, contextOf, writeJson, launch, REPORTS } from './common.mjs'
import { STATUSES } from './inventory.mjs'

const dir = await ensureDir(join(REPORTS, 'teclado'))
const status = (id) => STATUSES.find((e) => e.id === id)

/** Lo que tiene el foco: rol, nombre y si su anillo de foco se ve. */
function focus(page) {
  return page.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return { name: '(body)' }
    const style = getComputedStyle(e)
    const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const shadow = style.boxShadow !== 'none'
    const name = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('title') || e.getAttribute('placeholder') || '').trim().replace(/\s+/gu, ' ').slice(0, 60)
    const r = e.getBoundingClientRect()
    return { label: e.tagName.toLowerCase(), role: e.getAttribute('role'), name, visible: ring || shadow, dialogInside: Boolean(e.closest('[role="dialog"],[role="alertdialog"]')), height: Math.round(r.height), width: Math.round(r.width) }
  })
}

async function traverse(browser, id, view, tabs) {
  const context = await browser.newContext(contextOf(view))
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
    if (i === 0 || i === 3) await page.screenshot({ path: join(dir, `${id}--${view}--tab${String(i + 1)}.png`) })
  }
  await context.close()
  return { id, view, steps }
}

// `item`: el diálogo se abre desde un elemento del menú «⋯» cuyo botón es `trigger`; el foco debe volver a ese botón.
async function dialog(browser, id, trigger, view, item) {
  const context = await browser.newContext(contextOf(view))
  const e = status(id)
  const page = await openStatus(browser, context, { ...e, class: 'ruta', wait: undefined, steps: [] })
  const button = page.getByRole('button', { name: trigger, exact: typeof trigger === 'string' }).first()
  await button.focus()
  await page.keyboard.press('Enter')
  if (item !== undefined) {
    const entry = page.getByRole('menuitem', { name: item, exact: true }).first()
    await entry.focus()
    await page.keyboard.press('Enter')
  }
  await page.waitForSelector('[role="dialog"],[role="alertdialog"]', { state: 'visible' })
  await page.waitForTimeout(400)
  const onOpen = await focus(page)
  const path = []
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab')
    path.push(await focus(page))
  }
  await page.screenshot({ path: join(dir, `${id}--${view}--dialogo.png`) })
  await page.keyboard.press('Escape')
  // La animación de salida deja el diálogo en el DOM un momento; con la
  // máquina cargada puede pasar del segundo.
  const closed = await page
    .waitForFunction(() => !document.querySelector('[role="dialog"],[role="alertdialog"]'), null, { timeout: 5000 })
    .then(() => true, () => false)
  const onClose = await focus(page)
  await context.close()
  return {
    id, view, trigger, onOpen,
    focusTrapped: path.every((p) => p.dialogInside),
    ringVisible: path.filter((p) => !p.visible).map((p) => p.name),
    closedWithEscape: closed,
    focusReturned: onClose.name.includes(typeof trigger === 'string' ? trigger : 'Más acciones de'),
    onClose,
  }
}

// La paleta se abre también con Ctrl+K (sin botón al que volver): el foco entra al cuadro de búsqueda, Escape cierra y el foco vuelve a donde estaba.
async function shortcut(browser, id, view) {
  const context = await browser.newContext(contextOf(view))
  const page = await openStatus(browser, context, { ...status(id), class: 'ruta', wait: undefined, steps: [] })
  const field = page.getByRole('link', { name: 'Pedidos' }).first()
  await field.focus()
  await page.keyboard.press('Control+K')
  await page.waitForSelector('[role="dialog"]', { state: 'visible' })
  await page.waitForTimeout(400)
  const onOpen = await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), expanded: document.activeElement?.getAttribute('aria-expanded') }))
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), null, { timeout: 5000 })
  const onClose = await focus(page)
  await context.close()
  return { id, view, onOpen, focusReturned: onClose.name.includes('Pedidos'), onClose }
}

const browserInstance = await launch()
const result = {
  routes: [
    await traverse(browserInstance, 'acceso', 'desktop', 6),
    await traverse(browserInstance, 'pedidos', 'mobile', 10),
    await traverse(browserInstance, 'pedidos-nuevo', 'mobile', 12),
    await traverse(browserInstance, 'tablero', 'desktop', 12),
  ],
  dialogs: [
    await dialog(browserInstance, 'o-cobro', 'Cobrar', 'desktop'),
    await dialog(browserInstance, 'o-nueva-mesa', 'Nueva mesa', 'desktop'),
    await dialog(browserInstance, 'o-llevar', 'Para llevar / Delivery', 'mobile'),
    await dialog(browserInstance, 'o-paleta', 'Buscar o ir a…', 'desktop'),
    await dialog(browserInstance, 'o-desactivar-cuenta', /^Más acciones de/, 'desktop', 'Desactivar'),
  ],
  shortcuts: [await shortcut(browserInstance, 'o-paleta', 'desktop')],
}
await browserInstance.close()
await writeJson(join(dir, 'teclado.json'), result)
for (const r of result.routes) {
  console.log(`\n${r.id} (${r.view}): ${r.steps.map((p, i) => `${String(i + 1)}. ${p.name}${p.visible ? '' : ' [sin anillo]'}`).join(' → ')}`)
}
for (const d of result.dialogs) {
  console.log(`\nDiálogo «${d.trigger}» en ${d.id} (${d.view}): foco inicial en «${d.onOpen.name}», atrapado ${d.focusTrapped ? 'sí' : 'NO'}, anillo ausente en [${d.ringVisible.join(', ')}], Escape cierra ${d.closedWithEscape ? 'sí' : 'NO'}, foco devuelto ${d.focusReturned ? 'sí' : 'NO'} («${d.onClose.name}»)`)
}
for (const s of result.shortcuts) {
  console.log(`
Atajo Ctrl+K en ${s.id} (${s.view}): el foco entra a role=${s.onOpen.role}, expandido=${s.onOpen.expanded}, foco devuelto ${s.focusReturned ? 'sí' : 'NO'} («${s.onClose.name}»)`)
}

// Que el foco no vuelva al botón que abrió la ventana (WCAG 2.4.3) rompe la
// corrida: así no regresa el fallo sin que nadie lo vea en el resumen.
const lost = [...result.dialogs, ...result.shortcuts].filter((d) => !d.focusReturned)
if (lost.length > 0) {
  console.error(`\nEl foco no volvió al disparador en: ${lost.map((d) => `${d.id} (${d.view})`).join(', ')}`)
  process.exitCode = 1
}
