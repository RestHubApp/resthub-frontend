import { Outlet } from 'react-router'

import EmptyState from '../../components/EmptyState'
import { isPreviewTab } from '../../services/tabStorage'
import PreviewExitButton from './PreviewExitButton'

/**
 * La puerta del área de plataforma (`/plataforma`).
 *
 * En una pestaña de vista previa no se muestra la administración del
 * sistema: esa pestaña no lee ni escribe la sesión de plataforma del
 * navegador, y usarla ahí mezclaría las dos sesiones. Queda un aviso con
 * «Salir de la vista previa», que la cierra o vuelve a la administración
 * como una pestaña normal.
 */
export default function PreviewPlatformGate() {
  if (!isPreviewTab()) {
    return <Outlet />
  }
  return (
    <main id="contenido" tabIndex={-1} className="flex min-h-dvh flex-col justify-center bg-background px-4 py-6 outline-none sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <EmptyState
          title="Estás en una vista previa"
          description="Sal de la vista previa para usar la administración del sistema."
        >
          <PreviewExitButton tone="page" />
        </EmptyState>
      </div>
    </main>
  )
}
