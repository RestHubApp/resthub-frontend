// Reemplazo de `vi.stubGlobal` y `vi.unstubAllGlobals` de Vitest, que Jest no
// trae: pone un valor en `globalThis` y guarda el original para devolverlo.
const originales = new Map<PropertyKey, PropertyDescriptor | undefined>()

export function stubGlobal(nombre: string, valor: unknown): void {
  if (!originales.has(nombre)) {
    originales.set(nombre, Object.getOwnPropertyDescriptor(globalThis, nombre))
  }
  Object.defineProperty(globalThis, nombre, { value: valor, writable: true, configurable: true, enumerable: true })
}

export function unstubAllGlobals(): void {
  for (const [nombre, descriptor] of originales) {
    if (descriptor) {
      Object.defineProperty(globalThis, nombre, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, nombre)
    }
  }
  originales.clear()
}
