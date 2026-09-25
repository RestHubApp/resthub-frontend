// En el celular el boton flotante del widget se oculta (index.css): tapaba el
// "+" de los platos al tomar un pedido. El menu se abre desde "Más" con esto.

/** Abre el menú del widget de accesibilidad como si se tocara su botón. */
export function openAccessibilityMenu(): void {
  const boton = document.querySelector<HTMLElement>('.asw-menu-btn')
  boton?.click()
}
