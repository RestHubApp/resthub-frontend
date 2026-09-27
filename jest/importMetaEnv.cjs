// Plugin de Babel para Jest. Jest corre el código como CommonJS, donde
// `import.meta` no existe, y Vite lo reemplaza solo al compilar.
// - `import.meta.env` pasa a leer `globalThis.__VITE_ENV__`, que arma
//   `jest/setup.ts` con los valores que Vite da en modo de prueba.
// - Cualquier otro `import.meta` (p. ej. `import.meta.hot` de React Router)
//   queda como un objeto con `env` y la `url` del archivo.
module.exports = function importMetaEnv({ types: t, template }) {
  const env = () => t.memberExpression(t.identifier('globalThis'), t.identifier('__VITE_ENV__'))
  const meta = template.expression(
    "({ env: globalThis.__VITE_ENV__, url: require('node:url').pathToFileURL(__filename).href })",
    { placeholderPattern: false },
  )
  const esImportMeta = (nodo) =>
    t.isMetaProperty(nodo) && nodo.meta.name === 'import' && nodo.property.name === 'meta'
  return {
    name: 'resthub-import-meta-env',
    visitor: {
      MemberExpression(path) {
        const { object, property, computed } = path.node
        if (esImportMeta(object) && !computed && t.isIdentifier(property, { name: 'env' })) {
          path.replaceWith(env())
        }
      },
      MetaProperty(path) {
        if (esImportMeta(path.node)) {
          path.replaceWith(meta())
        }
      },
    },
  }
}
