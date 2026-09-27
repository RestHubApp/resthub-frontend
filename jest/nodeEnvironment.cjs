// El entorno de Node para las pruebas que simulan una pestaña sin DOM
// (`@jest-environment ./jest/nodeEnvironment.cjs`).
//
// Es el de Jest tal cual. Solo dentro de Stryker se le agrega el mixin que
// informa qué pruebas cubren cada mutante: Stryker cambia el entorno de la
// configuración, pero no el que declara un archivo en su docblock.
const { TestEnvironment } = require('jest-environment-node')

let Entorno = TestEnvironment
if (process.env.STRYKER_MUTATOR_WORKER !== undefined) {
  const { mixinJestEnvironment } = require('@stryker-mutator/jest-runner')
  Entorno = mixinJestEnvironment(TestEnvironment)
}

module.exports = Entorno
