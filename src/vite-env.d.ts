/// <reference types="vite/client" />

/**
 * Tipos de las variables de entorno del proyecto.
 *
 * Sin esto, `import.meta.env.LO_QUE_SEA` es `any` y el linter estricto lo
 * rechaza, que es exactamente lo que debe hacer.
 */
interface ImportMetaEnv {
  /** Origen del backend en produccion, sin `/api/v1`. Vacio en desarrollo. */
  readonly VITE_API_URL?: string
  readonly VITE_LOG_LEVEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * sienna-accessibility no publica tipos propios: se importa solo por su
 * side-effect de auto-inicialización (ver
 * src/components/AccessibilityWidget.tsx), sin bindings que tipar.
 */
declare module 'sienna-accessibility'
