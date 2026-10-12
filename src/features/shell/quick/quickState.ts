import { create } from 'zustand'

interface QuickPaletteState {
  /** La paleta está abierta. */
  isOpen: boolean
  /** Alguna vez se abrió: desde entonces su archivo está montado. */
  hasOpened: boolean
  /** Se pidió «Cerrar sesión» con pedidos sin enviar: falta la confirmación. */
  isSignOutAsked: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (isOpen: boolean) => void
  askSignOut: (isAsked: boolean) => void
}

// Quién tenía el foco al abrir. Radix devuelve el foco solo al botón que abre un
// diálogo (`Trigger`), y la paleta se abre también con el teclado, sin botón.
const focus: { origin: HTMLElement | null } = { origin: null }

function rememberFocus(): void {
  focus.origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
}

/**
 * Devuelve el foco a quien lo tenía al abrir la paleta (lo exige el patrón de
 * diálogo modal). Si ya no está en la página, va al contenido.
 */
export function restoreFocus(): void {
  const { origin } = focus
  focus.origin = null
  if (origin?.isConnected === true && origin !== document.body) {
    origin.focus()
  } else {
    document.getElementById('contenido')?.focus()
  }
}

/**
 * El estado de la paleta de comandos: lo comparten los botones que la abren, el
 * atajo de teclado y la paleta misma (que se descarga recién al abrirla).
 */
export const useQuickPalette = create<QuickPaletteState>((set, get) => ({
  isOpen: false,
  hasOpened: false,
  isSignOutAsked: false,
  open: () => {
    rememberFocus()
    set({ isOpen: true, hasOpened: true })
  },
  close: () => {
    set({ isOpen: false })
  },
  toggle: () => {
    if (!get().isOpen) {
      rememberFocus()
    }
    set((state) => ({ isOpen: !state.isOpen, hasOpened: true }))
  },
  setOpen: (isOpen) => {
    if (isOpen && !get().isOpen) {
      rememberFocus()
    }
    set((state) => ({ isOpen, hasOpened: state.hasOpened || isOpen }))
  },
  askSignOut: (isAsked) => {
    set({ isSignOutAsked: isAsked })
  },
}))
