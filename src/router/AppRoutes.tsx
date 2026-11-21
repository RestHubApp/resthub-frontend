import { useRoutes } from 'react-router'

import { routes } from './routes'

/** Las rutas de la aplicación dentro del `BrowserRouter` de `main.tsx`. */
export function AppRoutes() {
  return useRoutes(routes)
}
