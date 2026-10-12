// Reemplazo de `vi.stubGlobal` y `vi.unstubAllGlobals` de Vitest, que Jest no
// trae: pone un valor en `globalThis` y guarda el original para devolverlo.
const original = new Map<PropertyKey, PropertyDescriptor | undefined>()

export function stubGlobal(name: string, value: unknown): void {
  if (!original.has(name)) {
    original.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
  }
  Object.defineProperty(globalThis, name, { value: value, writable: true, configurable: true, enumerable: true })
}

export function unstubAllGlobals(): void {
  for (const [name, descriptor] of original) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
  original.clear()
}
