import { Component, type ReactNode } from 'react'

import { RouteError } from './RouteError'

interface BoundaryProps {
  readonly children: ReactNode
  /** Al cambiar (otra navegación), la pantalla de error se va y se vuelve a intentar. */
  readonly resetKey: string
}

interface BoundaryState {
  readonly failed: boolean
  readonly resetKey: string
}

/**
 * Lo que atrapa una ruta que falla al renderizar o al bajar su archivo y muestra
 * `RouteError` en su lugar. El error ya lo anota `onCaughtError` de `main.tsx`.
 * Se usa a través de `RouteBoundary`, que le pasa la navegación actual.
 */
export class RouteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true }
  }

  // Se reinicia antes de renderizar la navegación nueva, no después: así un error
  // que llega en la misma navegación se atrapa (y se anota) una sola vez.
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  override render() {
    return this.state.failed ? <RouteError /> : this.props.children
  }
}
