// Revisión breve de navegación con teclado (lo que las herramientas
// automáticas no miden): recorre con Tab unas pantallas, anota a dónde va el
// foco y si se ve, y comprueba que un diálogo atrapa el foco, se cierra con
// Escape y devuelve el foco al botón que lo abrió. Deja capturas del foco.
import { join } from 'node:path'

import { abrirEstado, asegurarDir, contextoDe, escribirJson, lanzar, REPORTES } from './comun.mjs'
import { ESTADOS } from './inventario.mjs'

const dir = await asegurarDir(join(REPORTES, 'teclado'))
const estado = (id) => ESTADOS.find((e) => e.id === id)

/** Lo que tiene el foco: rol, nombre y si su anillo de foco se ve. */
function foco(pagina) {
  return pagina.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return { nombre: '(body)' }
    const estilo = getComputedStyle(e)
    const anillo = estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0
    const sombra = estilo.boxShadow !== 'none'
    const nombre = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('title') || e.getAttribute('placeholder') || '').trim().replace(/\s+/gu, ' ').slice(0, 60)
    const r = e.getBoundingClientRect()
    return { etiqueta: e.tagName.toLowerCase(), rol: e.getAttribute('role'), nombre, visible: anillo || sombra, dentroDeDialogo: Boolean(e.closest('[role="dialog"],[role="alertdialog"]')), alto: Math.round(r.height), ancho: Math.round(r.width) }
  })
}

async function recorrer(navegador, id, vista, tabs) {
  const contexto = await navegador.newContext(contextoDe(vista))
  const pagina = await abrirEstado(navegador, contexto, estado(id))
  // El recorrido empieza desde el principio del documento, como al cargar.
  await pagina.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.getSelection()?.removeAllRanges()
  })
  const pasos = []
  for (let i = 0; i < tabs; i += 1) {
    await pagina.keyboard.press('Tab')
    pasos.push(await foco(pagina))
    if (i === 0 || i === 3) await pagina.screenshot({ path: join(dir, `${id}--${vista}--tab${String(i + 1)}.png`) })
  }
  await contexto.close()
  return { id, vista, pasos }
}

async function dialogo(navegador, id, disparador, vista) {
  const contexto = await navegador.newContext(contextoDe(vista))
  const e = estado(id)
  const pagina = await abrirEstado(navegador, contexto, { ...e, clase: 'ruta', espera: undefined, pasos: [] })
  const boton = pagina.getByRole('button', { name: disparador, exact: true }).first()
  await boton.focus()
  await pagina.keyboard.press('Enter')
  await pagina.waitForSelector('[role="dialog"],[role="alertdialog"]', { state: 'visible' })
  await pagina.waitForTimeout(400)
  const alAbrir = await foco(pagina)
  const recorrido = []
  for (let i = 0; i < 40; i += 1) {
    await pagina.keyboard.press('Tab')
    recorrido.push(await foco(pagina))
  }
  await pagina.screenshot({ path: join(dir, `${id}--${vista}--dialogo.png`) })
  await pagina.keyboard.press('Escape')
  // La animación de salida deja el diálogo en el DOM un momento; con la
  // máquina cargada puede pasar del segundo.
  const cerrado = await pagina
    .waitForFunction(() => !document.querySelector('[role="dialog"],[role="alertdialog"]'), null, { timeout: 5000 })
    .then(() => true, () => false)
  const alCerrar = await foco(pagina)
  await contexto.close()
  return {
    id, vista, disparador, alAbrir,
    focoAtrapado: recorrido.every((p) => p.dentroDeDialogo),
    anilloVisible: recorrido.filter((p) => !p.visible).map((p) => p.nombre),
    cerradoConEscape: cerrado,
    focoDevuelto: alCerrar.nombre.includes(disparador),
    alCerrar,
  }
}

const navegador = await lanzar()
const resultado = {
  recorridos: [
    await recorrer(navegador, 'acceso', 'escritorio', 6),
    await recorrer(navegador, 'pedidos', 'movil', 10),
    await recorrer(navegador, 'pedidos-nuevo', 'movil', 12),
    await recorrer(navegador, 'tablero', 'escritorio', 12),
  ],
  dialogos: [
    await dialogo(navegador, 'o-cobro', 'Cobrar', 'escritorio'),
    await dialogo(navegador, 'o-nueva-mesa', 'Nueva mesa', 'escritorio'),
    await dialogo(navegador, 'o-llevar', 'Para llevar / Delivery', 'movil'),
    await dialogo(navegador, 'o-desactivar-cuenta', 'Desactivar', 'escritorio'),
  ],
}
await navegador.close()
await escribirJson(join(dir, 'teclado.json'), resultado)
for (const r of resultado.recorridos) {
  console.log(`\n${r.id} (${r.vista}): ${r.pasos.map((p, i) => `${String(i + 1)}. ${p.nombre}${p.visible ? '' : ' [sin anillo]'}`).join(' → ')}`)
}
for (const d of resultado.dialogos) {
  console.log(`\nDiálogo «${d.disparador}» en ${d.id} (${d.vista}): foco inicial en «${d.alAbrir.nombre}», atrapado ${d.focoAtrapado ? 'sí' : 'NO'}, anillo ausente en [${d.anilloVisible.join(', ')}], Escape cierra ${d.cerradoConEscape ? 'sí' : 'NO'}, foco devuelto ${d.focoDevuelto ? 'sí' : 'NO'} («${d.alCerrar.nombre}»)`)
}
