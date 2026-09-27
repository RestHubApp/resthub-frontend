import { createPortal } from 'react-dom'

import { useNotifications } from '../../store/notifications'
import ToastItem from './ToastItem'

export default function ToastStack() {
  const toasts = useNotifications((state) => state.toasts)

  if (toasts.length === 0) {
    return null
  }

  // La columna se corre a la izquierda del botón de accesibilidad, que vive
  // fijo en la esquina inferior derecha (ver index.html): por más avisos que
  // se apilen, ninguno queda debajo del botón ni de su "Descartar". En el
  // celular además sube por encima de la barra de navegación.
  //
  // Va en su propio portal en <body> y por encima del velo de las ventanas:
  // con un diálogo abierto, Radix oculta (`aria-hidden`) lo que queda fuera del
  // diálogo, y el resultado de cobrar o de un descuento rechazado no se
  // anunciaba ni se veía nítido detrás del velo.
  return createPortal(
    <div
      className="fixed right-24 bottom-24 z-[60] flex w-[min(22rem,calc(100vw-8rem))] flex-col gap-2 pointer-events-none lg:bottom-4"
      role="status"
      aria-live="polite"
      aria-label="Avisos del sistema"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem id={toast.id} tone={toast.tone} message={toast.message} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
