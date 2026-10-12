import { type Appearance, resolveTheme } from './appearanceRules'

// Aplica las preferencias a la página con atributos de <html>
// (`data-theme`, `data-font`, `data-text-size`), que `index.css` convierte en
// colores, letra y escala. No se escribe ningún estilo en línea: la CSP lo prohíbe.

const DARK_MODE = '(prefers-color-scheme: dark)'

function darkMedia(): MediaQueryList | null {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function' ? null : window.matchMedia(DARK_MODE)
}

/** El color de la barra del navegador sigue al `--primary` del tema, como siempre. */
function syncBrowserColor(): void {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  if (color !== '') {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }
}

/** Pone el tema, la letra y el tamaño en <html>. Sin documento (pruebas de lógica) no hace nada. */
export function applyAppearance(appearance: Appearance): void {
  if (typeof document === 'undefined') {
    return
  }
  const root = document.documentElement
  root.setAttribute('data-theme', resolveTheme(appearance.theme, darkMedia()?.matches === true))
  root.setAttribute('data-font', appearance.font)
  root.setAttribute('data-text-size', appearance.textSize)
  syncBrowserColor()
  // Con la hoja de estilos aún sin cargar el token está vacío: se completa al terminar la carga.
  if (document.readyState !== 'complete') {
    window.addEventListener('load', syncBrowserColor, { once: true })
  }
}

/** Avisa cuando el aparato pasa de claro a oscuro, para «Según el sistema». */
export function watchSystemTheme(onChange: () => void): void {
  darkMedia()?.addEventListener('change', onChange)
}

