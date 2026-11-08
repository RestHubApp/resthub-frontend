import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

import { RouteErrorBoundary } from './RouteErrorBoundary'

/** `RouteErrorBoundary` que vuelve a intentar en cada navegación, como el del modo de datos. */
export function RouteBoundary({ children }: { readonly children: ReactNode }) {
  const { key } = useLocation()
  return <RouteErrorBoundary resetKey={key}>{children}</RouteErrorBoundary>
}
