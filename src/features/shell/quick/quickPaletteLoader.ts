import { lazyNamed } from '@/components/lazyNamed'

/** El `import()` de la paleta: así `cmdk` y su lista quedan fuera del archivo inicial. */
function loadQuickPalette() {
  return import('@/features/shell/quick/QuickPalette')
}

/** La paleta perezosa: se monta (y se descarga) la primera vez que se abre. */
export const LazyQuickPalette = lazyNamed(loadQuickPalette, 'QuickPalette')

/** Descarga el archivo de la paleta antes de abrirla (al acercarse a su botón), sin montarla. */
function preloadQuickPalette(): void {
  void loadQuickPalette().catch(() => undefined)
}

/** Eventos de un botón que abre la paleta: al acercarse, tocar o enfocarlo se baja el archivo, y al hacer clic ya está. */
export const PRELOAD_QUICK_PALETTE = {
  onPointerEnter: preloadQuickPalette,
  onFocus: preloadQuickPalette,
  onTouchStart: preloadQuickPalette,
}
