// jsdom con las clases de la API fetch de Node.
//
// jsdom no trae Request, Response, Headers ni los flujos, y React Router los
// usa en cada navegación de un router de datos. Se toman de Node junto con su
// AbortController: un Request de Node rechaza la señal de un AbortController
// de jsdom. También `fetch`: MSW (jest/mswServer.ts) lo intercepta y ninguna
// petición sale a la red.
const { TestEnvironment } = require('jest-environment-jsdom')

const DE_NODE = [
  'Request',
  'Response',
  'Headers',
  'AbortController',
  'AbortSignal',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextDecoderStream',
  'TextEncoderStream',
  'TextEncoder',
  'TextDecoder',
  'structuredClone',
  'BroadcastChannel',
  // MSW intercepta este `fetch` (ver jest/mswServer.ts): sin él no hay nada que interceptar.
  'fetch',
]

class EnvironmentJsdom extends TestEnvironment {
  constructor(config, context) {
    super(config, context)
    for (const name of DE_NODE) {
      if (name in globalThis) {
        this.global[name] = globalThis[name]
      }
    }
  }
}

module.exports = EnvironmentJsdom
