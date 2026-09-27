// Registro mínimo para el navegador. No carga Pino ni su serializador en cada
// pantalla; conserva las llamadas `child`, `warn`, `error` y los niveles que
// usan la aplicación y el API. Nunca serializa cuerpos ni cabeceras HTTP.
type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
type Fields = Record<string, unknown>
type LogArgument = Fields | string

const severity: Record<Level, number> = {
  fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10,
}

function configuredLevel(): Level {
  const requested = import.meta.env.VITE_LOG_LEVEL
  if (typeof requested === 'string' && Object.hasOwn(severity, requested)) return requested as Level
  return import.meta.env.DEV ? 'debug' : 'warn'
}

const minimum = severity[configuredLevel()]

function serialize(fields: Fields): Fields {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => {
    if (value instanceof Error) return [key, { type: value.name, message: value.message }]
    return [key, value]
  }))
}

function createLogger(context: Fields = {}) {
  const log = (level: Level, first: LogArgument, message?: string): void => {
    if (severity[level] < minimum) return
    const payload = {
      level: severity[level], time: Date.now(), ...context,
      ...(typeof first === 'string' ? {} : serialize(first)),
      msg: typeof first === 'string' ? first : message ?? '',
    }
    if (level === 'fatal' || level === 'error') console.error(payload)
    else if (level === 'warn') console.warn(payload)
    // eslint-disable-next-line no-console -- El adaptador de logs es el único lugar donde se usa la consola deliberadamente.
    else if (level === 'info') console.info(payload)
    // eslint-disable-next-line no-console -- El nivel debug solo se emite si el entorno lo habilita.
    else console.debug(payload)
  }
  return {
    child: (extra: Fields) => createLogger({ ...context, ...extra }),
    fatal: (first: LogArgument, message?: string) => { log('fatal', first, message) },
    error: (first: LogArgument, message?: string) => { log('error', first, message) },
    warn: (first: LogArgument, message?: string) => { log('warn', first, message) },
    info: (first: LogArgument, message?: string) => { log('info', first, message) },
    debug: (first: LogArgument, message?: string) => { log('debug', first, message) },
    trace: (first: LogArgument, message?: string) => { log('trace', first, message) },
  }
}

export const logger = createLogger()

/** Conserva el mismo formato de los logs de React, manejadores y promesas. */
export function logUncaughtErrors(): void {
  window.addEventListener('error', (event) => {
    logger.error({ err: event.error as unknown, source: event.filename, line: event.lineno }, 'app.uncaught_error')
  })
  window.addEventListener('unhandledrejection', (event) => {
    logger.error({ err: event.reason as unknown }, 'app.unhandled_rejection')
  })
}
