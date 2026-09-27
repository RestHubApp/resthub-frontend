// jsdom con las clases de la API fetch de Node.
//
// jsdom no trae Request, Response, Headers ni los flujos, y React Router los
// usa en cada navegación de un router de datos. Se toman de Node junto con su
// AbortController: un Request de Node rechaza la señal de un AbortController
// de jsdom. `fetch` no se copia: en las pruebas nada sale a la red (ver
// jest/setupDom.ts).
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
]

class EntornoJsdom extends TestEnvironment {
  constructor(config, context) {
    super(config, context)
    for (const nombre of DE_NODE) {
      if (nombre in globalThis) {
        this.global[nombre] = globalThis[nombre]
      }
    }
  }
}

module.exports = EntornoJsdom
