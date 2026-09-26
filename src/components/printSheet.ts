// La hoja de una impresora térmica: 80 mm de ancho y el largo que haga falta.
// En pantalla se ve igual de angosta, centrada, para revisar antes de imprimir.
export const PRINT_CSS = `
@page { size: 80mm auto; margin: 3mm; }
@media print {
  html, body { background: #fff !important; }
  body * { visibility: hidden; }
  #hoja-impresa, #hoja-impresa * { visibility: visible; }
  #hoja-impresa { position: absolute; inset: 0 auto auto 0; width: 74mm; box-shadow: none; }
}
`
