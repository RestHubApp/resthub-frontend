import { type ComponentType, lazy, type ReactElement } from 'react'

type LoadScreen = () => Promise<{ default: ComponentType }>

/**
 * Una pantalla que se descarga recién al abrirla. No lleva su propio `Suspense`:
 * la espera la muestra `ScreenOutlet`, uno solo para todas las pantallas del
 * armazón, para que al navegar se quede a la vista la pantalla anterior.
 */
export function lazyScreen(load: LoadScreen): ReactElement {
  const Screen = lazy(load)
  return <Screen />
}
