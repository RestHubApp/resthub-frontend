// Dónde guarda esta pestaña la sesión de restaurante y la cola sin señal.
//
// Una pestaña normal usa `localStorage`: la sesión sobrevive a recargar y a
// cerrar la app. Una pestaña de vista previa (la que abre el administrador del
// sistema para ver RestHub como una cuenta del local de muestra) usa
// `sessionStorage`: dura lo que dure esa pestaña y nunca lee ni pisa la sesión
// de restaurante guardada en el navegador ni la de plataforma. Se decide una
// sola vez, al cargar la página, y no cambia mientras la pestaña siga abierta.

/** La sesión de restaurante de siempre, en `localStorage`. */
export const RESTAURANT_SESSION_KEY = 'resthub.session.v2'
/** La sesión de vista previa, en el `sessionStorage` de su pestaña. */
export const PREVIEW_SESSION_KEY = 'resthub.vista-previa.sesion.v1'
/**
 * Marca la pestaña como de vista previa aunque su sesión ya haya vencido: así
 * no vuelve a leer la sesión real del navegador hasta que alguien sale de la
 * vista previa a propósito.
 */
export const PREVIEW_TAB_KEY = 'resthub.vista-previa.pestana.v1'
/** La ruta que canjea el código de vista previa, sin la base de la aplicación. */
export const PREVIEW_ENTRY_PATH = '/vista-previa'

/** Lo que se usa de `Storage`: así las pruebas pasan un mapa en memoria. */
export interface KeyValueStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export type TabKind = 'restaurant' | 'preview'

export interface TabStorage {
  readonly kind: TabKind
  /** `null` si el navegador no deja usar el almacenamiento: la sesión vive solo en memoria. */
  readonly storage: KeyValueStorage | null
  /** La clave de la sesión de restaurante en `storage`. */
  readonly sessionKey: string
}

interface TabEnvironment {
  /** La ruta de la página al cargarla. */
  readonly pathname: string
  /** La base de la aplicación (`import.meta.env.BASE_URL`). */
  readonly base: string
  readonly local: KeyValueStorage | null
  readonly tab: KeyValueStorage | null
}

// Estas dos funciones copian cómo React Router lee la dirección: quita la
// base sin distinguir mayúsculas y decodifica cada tramo. Si esta pestaña y el
// router no coincidieran, `/Vista-Previa` o `/vista%2Dprevia` llegarían a la
// ruta de canje en una pestaña que no se eligió como de vista previa.
function quitarBase(pathname: string, base: string): string | null {
  if (base === '' || base === '/') {
    return pathname
  }
  if (!pathname.toLowerCase().startsWith(base.toLowerCase())) {
    return null
  }
  const inicio = base.endsWith('/') ? base.length - 1 : base.length
  const siguiente = pathname.charAt(inicio)
  if (siguiente !== '' && siguiente !== '/') {
    return null
  }
  return pathname.slice(inicio) || '/'
}

function decodificar(ruta: string): string {
  try {
    return ruta
      .split('/')
      .map((tramo) => decodeURIComponent(tramo).replace(/\//gu, '%2F'))
      .join('/')
  } catch {
    // Un `%` mal escrito: el router tampoco la decodifica.
    return ruta
  }
}

/**
 * La ruta de la aplicación tal como la compara React Router: sin la base,
 * decodificada, en minúsculas (sus rutas no distinguen mayúsculas) y sin la
 * barra final. `null` si la dirección no está bajo la base.
 */
export function appPath(pathname: string, base: string): string | null {
  const ruta = quitarBase(pathname, base)
  if (ruta === null) {
    return null
  }
  let normal = decodificar(ruta).toLowerCase()
  while (normal.endsWith('/')) {
    normal = normal.slice(0, -1)
  }
  return normal === '' ? '/' : normal
}

/** Si la página se cargó en la ruta que canjea un código de vista previa, escrita como sea. */
export function isPreviewEntry(pathname: string, base: string): boolean {
  return appPath(pathname, base) === PREVIEW_ENTRY_PATH
}

/** La dirección de la ruta de canje tal como la escribe la aplicación, con su base. */
export function previewEntryUrl(base: string = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/$/u, '')}${PREVIEW_ENTRY_PATH}`
}

function marcada(tab: KeyValueStorage | null): boolean {
  if (tab === null) {
    return false
  }
  try {
    return tab.getItem(PREVIEW_TAB_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Elige el almacenamiento de la pestaña.
 *
 * Es de vista previa si se cargó para canjear un código o si ya lo era antes
 * de recargar. En ese caso nunca cae en `localStorage`: sin `sessionStorage`
 * la sesión de vista previa vive solo en memoria, que es peor que recargar
 * pero mejor que pisar la sesión real del navegador.
 */
export function chooseTabStorage(env: TabEnvironment): TabStorage {
  if (isPreviewEntry(env.pathname, env.base) || marcada(env.tab)) {
    return { kind: 'preview', storage: env.tab, sessionKey: PREVIEW_SESSION_KEY }
  }
  return { kind: 'restaurant', storage: env.local, sessionKey: RESTAURANT_SESSION_KEY }
}

// Leer `localStorage` o `sessionStorage` puede lanzar con el almacenamiento
// bloqueado; en las pruebas, sin navegador, no existen.
function almacen(obtener: () => KeyValueStorage | undefined): KeyValueStorage | null {
  try {
    return obtener() ?? null
  } catch {
    return null
  }
}

function entornoActual(): TabEnvironment {
  const global = globalThis as {
    location?: { pathname: string }
    localStorage?: KeyValueStorage
    sessionStorage?: KeyValueStorage
  }
  return {
    pathname: global.location?.pathname ?? '/',
    base: import.meta.env.BASE_URL,
    local: almacen(() => global.localStorage),
    tab: almacen(() => global.sessionStorage),
  }
}

/** El almacenamiento de esta pestaña, elegido al cargar la página. */
export const tabStorage: TabStorage = chooseTabStorage(entornoActual())

/** Si esta pestaña es de vista previa. */
export function isPreviewTab(): boolean {
  return tabStorage.kind === 'preview'
}

/**
 * Marca o desmarca esta pestaña como de vista previa.
 *
 * Se marca al abrir la sesión de vista previa y se desmarca solo al salir de
 * ella a propósito; vencer no la desmarca. En una pestaña normal no hace nada:
 * nunca se escribe esta marca fuera de una vista previa.
 */
export function setPreviewTabMark(marked: boolean): void {
  if (tabStorage.kind !== 'preview' || tabStorage.storage === null) {
    return
  }
  try {
    if (marked) {
      tabStorage.storage.setItem(PREVIEW_TAB_KEY, '1')
    } else {
      tabStorage.storage.removeItem(PREVIEW_TAB_KEY)
    }
  } catch {
    // Sin almacenamiento la marca dura lo que la página, igual que la sesión.
  }
}
