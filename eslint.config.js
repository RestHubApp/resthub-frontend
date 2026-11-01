import cspell from '@cspell/eslint-plugin'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import pluginQuery from '@tanstack/eslint-plugin-query'
import reactEffect from 'eslint-plugin-react-you-might-not-need-an-effect'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import checkFile from 'eslint-plugin-check-file'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import jestDom from 'eslint-plugin-jest-dom'
import testingLibrary from 'eslint-plugin-testing-library'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Importaciones que tienen un envoltorio propio en src (ver el bloque de los
// iconos y las primitivas, más abajo).
const UI_IMPORTS = [
  {
    name: 'lucide-react',
    message:
      'Los iconos salen del registro unico de src/components/icons.ts: usa <Icon glyph={icons.x} /> (import * as icons) y agrega alli el trazo que falte.',
  },
  {
    name: 'radix-ui',
    message:
      'Usa el componente de src/components/ui, que ya envuelve la primitiva con el tema. Si no existe, agregalo con `shadcn add`.',
  },
]
// react-hook-form vuelve a enfocar el primer error en un setTimeout y desvía
// lo que se está escribiendo a otro campo (GES-23).
const FORM_IMPORT = {
  name: 'react-hook-form',
  importNames: ['useForm'],
  message:
    'Usa useAppForm de src/hooks/useAppForm.ts: enfoca el primer error una sola vez y no desvía lo que se escribe a otro campo.',
}

// ---------------------------------------------------------------------
// Fuentes unicas por sintaxis (no-restricted-syntax).
//
// ESLint admite una sola lista de `no-restricted-syntax` por archivo, asi que
// cada fuente unica aporta su grupo de selectores y cada bloque de mas abajo
// compone los grupos que le tocan: `restrictSyntax(...)` los pide todos y
// `restrictSyntaxExcept('routes')` deja fuera el del modulo que es dueño de
// esa fuente. En los selectores, `\x2F` es la barra: esquery no deja
// escribirla dentro de una expresion regular.
// ---------------------------------------------------------------------
const SLASH_START = String.raw`/^\x2F/`

// Un literal de ruta es un string (o la primera parte de una plantilla) que
// empieza con barra, en un enlace, una navegacion o la definicion de una ruta.
const routeValues = [`Literal[value=${SLASH_START}]`, `TemplateLiteral > TemplateElement:first-child[value.raw=${SLASH_START}]`]
const routeContexts = [
  'JSXAttribute[name.name=/^(to|href)$/] ',
  'CallExpression[callee.name=/^(navigate|redirect|appUrl|closeTabOrGo)$/] ',
  'Property[key.name=/^(to|from|path)$/] > ',
]

const SYNTAX_SOURCES = {
  routes: {
    message:
      'Las rutas salen de src/services/paths.ts: usa paths.<pantalla> (por ejemplo paths.orders.detail(id)) y, si no existe, agregala alli.',
    selectors: routeContexts.flatMap((context) => routeValues.map((value) => `${context}${value}`)),
  },
  permissions: {
    message:
      'Los permisos tienen nombre en src/api/permissions.ts: usa PERMISSION.<nombre> y, si no existe, agregalo alli.',
    selectors: [
      String.raw`CallExpression[callee.name=/^(useCan|can|hasPermission)$/] Literal[value=/^[a-z_]+\.[a-z_]+$/]`,
      "Property[key.name='permission'] > Literal",
      "JSXAttribute[name.name='permission'] Literal",
    ],
  },
  queryKeys: {
    message:
      'Las claves de consulta se definen una vez en src/api con queryOptions; usa la consulta (xQuery()) o la clave exportada (xQueryKey).',
    selectors: ["Property[key.name='queryKey'] > ArrayExpression"],
  },
  colors: {
    message: 'Los colores son los tokens de index.css (clases de Tailwind); un hex o rgb() suelto se desfasa del tema.',
    selectors: [
      String.raw`Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]`,
      String.raw`Literal[value=/\b(rgba?|hsla?|oklch|oklab)\(/]`,
      String.raw`TemplateElement[value.raw=/\b(rgba?|hsla?|oklch|oklab)\(/]`,
    ],
  },
  roles: {
    message:
      'La interfaz pregunta por permisos (useCan), nunca por el rol: comparar su clase o su id solo se hace en features/roles y features/staff.',
    selectors: [
      String.raw`BinaryExpression[operator=/^[!=]==?$/] MemberExpression[property.name=/^(role_id|user_role_id|role_kind|role_name)$/]`,
      String.raw`BinaryExpression[operator=/^[!=]==?$/] MemberExpression[property.name='kind'][object.name=/^[rR]ole$/]`,
    ],
  },
  storage: {
    message: 'El almacenamiento del navegador pasa por src/services (tabStorage) y src/store, que ya limpian al cerrar sesion.',
    selectors: [
      String.raw`MemberExpression[object.name=/^(window|globalThis)$/][property.name=/^(localStorage|sessionStorage)$/]`,
      String.raw`Identifier[name=/^(localStorage|sessionStorage)$/]:not(MemberExpression > Identifier.property, Property > Identifier.key)`,
    ],
  },
  network: {
    message:
      'Solo src/services/api.ts habla con la red (openapi-fetch y fetch); el canal de avisos, src/services/eventStream.ts. Las pantallas usan las funciones de src/api.',
    selectors: [
      "ImportDeclaration[source.value='openapi-fetch']",
      "ExportNamedDeclaration[source.value='openapi-fetch']",
      "ImportExpression[source.value='openapi-fetch']",
      String.raw`MemberExpression[object.name=/^(window|globalThis|self)$/][property.name='fetch']`,
      "CallExpression[callee.name='fetch']",
    ],
  },
  errorText: {
    message:
      'Ninguna decisión depende del texto del error: el servidor manda un `code` estable (ErrorCode). Decide con hasCode(error, \'codigo\'), isSessionEnded o isUnreachable de services/apiError; errorMessage solo se muestra.',
    selectors: [
      // errorMessage(error, …).includes('…'), .startsWith, .match, etc.
      "CallExpression[callee.type='MemberExpression'][callee.object.type='CallExpression'][callee.object.callee.name='errorMessage']",
      // errorMessage(error, …) === '…', y cualquier otra comparación.
      "BinaryExpression > CallExpression[callee.name='errorMessage']",
      // Un `switch` sobre el texto.
      "SwitchStatement > CallExpression.discriminant[callee.name='errorMessage']",
      // El `detail` del cuerpo leído a mano en una condición: se lee con errorMessage para mostrarlo.
      "BinaryExpression > MemberExpression[property.name='detail'][object.property.name='body']",
      "CallExpression[callee.property.name=/^(includes|startsWith|endsWith|match|test)$/] > MemberExpression.callee > MemberExpression[property.name='detail'][object.property.name='body']",
    ],
  },
  apiSchema: {
    message: 'schema.d.ts es generado: solo src/api/types.ts lo importa y expone los tipos con nombre.',
    selectors: [String.raw`ImportDeclaration[source.value=/(^|\x2F)schema$/]`],
  },
}

/**
 * Archivos de prueba que pueden simular `@/api/*` o `@/services/api` con
 * `jest.mock`, cada uno con el motivo. Vacío: todas las pruebas pasan por MSW.
 */
const MOCKS_OF_API_ALLOWED = []

/** La regla compuesta con todos los grupos menos los de los modulos que son dueños de esa fuente. */
const restrictSyntaxExcept = (...owned) => [
  'error',
  ...Object.entries(SYNTAX_SOURCES)
    .filter(([name]) => !owned.includes(name))
    .flatMap(([, { selectors, message }]) => selectors.map((selector) => ({ selector, message }))),
]

// ---------------------------------------------------------------------
// Subcarpetas de una característica.
//
// Una subcarpeta (`orders/board`, `orders/charge`...) solo importa de sí misma
// y de la raíz de su característica. Si dos hermanas necesitan lo mismo, eso
// sube a la raíz. Las zonas se arman leyendo el disco, así una subcarpeta
// nueva queda cubierta sin tocar esta configuración.
// ---------------------------------------------------------------------
const FEATURES_DIR = fileURLToPath(new URL('./src/features/', import.meta.url))
const folders = (directory) => readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
const siblingFolderZones = folders(FEATURES_DIR).flatMap((feature) => {
  const subfolders = folders(`${FEATURES_DIR}${feature}`)
  return subfolders.flatMap((target) =>
    subfolders
      .filter((from) => from !== target)
      .map((from) => ({
        target: `./src/features/${feature}/${target}`,
        from: `./src/features/${feature}/${from}`,
        message: `Una subcarpeta no importa de su hermana (${feature}/${target} -> ${feature}/${from}): sube lo compartido a la raíz de ${feature}.`,
      })),
  )
})

export default tseslint.config(
  {
    ignores: ['dist/**', 'dist-e2e/**', 'dist-a11y/**', 'e2e/.results*/**', 'e2e/.report*/**', 'node_modules/**', 'src/api/schema.d.ts', 'src/components/ui/cn-tables.mjs', 'coverage/**', 'reports/**', '.stryker-tmp/**', 'checks/accessibility/.wave-ext/**', 'dist-carbon/**', 'checks/accessibility/reports/**'],
  },

  // ---------------------------------------------------------------------
  // Base: correccion del lenguaje y tipos.
  // ---------------------------------------------------------------------
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ---------------------------------------------------------------------
  // React.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      // SOLID, responsabilidad unica: un archivo describe un componente.
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // KISS y DRY: limites de tamano, complejidad y duplicacion.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,

      // DRY
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-collapsible-if': 'error',

      // KISS
      'sonarjs/cognitive-complexity': ['error', 15],
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['error', 3],
      'max-nested-callbacks': ['error', 3],

      // SOLID, inversion de dependencias: preferir contratos explicitos.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },

  // Las pruebas, sus ayudantes (jest/, e2e/) y los pactos conservan el límite
  // anterior: un `describe` agrupa casos, un pacto se arma en una función y los
  // ayudantes de Playwright reciben posicionales. Todo el código de producción
  // cumple 50 líneas, complejidad 8 y 3 parámetros.
  {
    files: ['**/*.test.{ts,tsx}', 'src/api/contract/**/*.ts', 'jest/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      complexity: ['error', 10],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
    },
  },

  // ---------------------------------------------------------------------
  // Seguridad (SAST).
  //
  // eslint-plugin-security trae sus reglas como avisos; aqui son errores para
  // que el CI las haga cumplir. De sonarjs se encienden las reglas de
  // seguridad que su preset recomendado deja apagadas y que aplican a una PWA:
  // registrar datos confidenciales, pedir permisos intrusivos del navegador,
  // Web SQL y expresiones regulares Unicode sin la bandera u. Un falso
  // positivo se suprime en su linea con el motivo, nunca aqui.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { security },
    rules: {
      ...Object.fromEntries(
        Object.keys(security.configs.recommended.rules).map((rule) => [rule, 'error']),
      ),
      // La unica regla apagada. No usa tipos: marca todo `objeto[clave]`, y en
      // la primera corrida dio 67 avisos, todos lecturas de un Record con una
      // clave de tipo union literal o de un arreglo con indice numerico. El
      // riesgo que busca, la contaminacion del prototipo con una clave que
      // escribe el usuario, ya lo cierra el tipo de la clave. Revision en
      // RestHub_Pruebas/07-seguridad/sast.md.
      'security/detect-object-injection': 'off',
      'sonarjs/confidential-information-logging': 'error',
      'sonarjs/no-intrusive-permissions': 'error',
      'sonarjs/web-sql-database': 'error',
      'sonarjs/unicode-aware-regex': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // Componentes de shadcn/ui.
  //
  // `src/components/ui` es codigo que genera y actualiza el CLI de shadcn. Se
  // lintea con todas las reglas del proyecto salvo dos, que contradicen su
  // diseno a proposito: cada archivo agrupa una familia de componentes (Card,
  // CardHeader, CardTitle...) y algunos exportan sus variantes junto al
  // componente. Separarlos rompería `shadcn add` en cada actualizacion.
  // ---------------------------------------------------------------------
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react/no-multi-comp': 'off',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['buttonVariants', 'badgeVariants', 'tabsListVariants'] },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Fuentes unicas de iconos y de primitivas.
  //
  // Los iconos de la aplicacion salen del registro de src/components/icons.ts,
  // que es la unica fuente de verdad. Lucide y Radix llegan como dependencias
  // de shadcn/ui y solo pueden usarse dentro de src/components/ui y, en el
  // caso de Lucide, en el registro; el resto de la aplicacion usa el registro
  // y los componentes ya tematizados. El armazón usa el mismo registro: cada
  // archivo nombra sus iconos (`icons.order`) y solo esos viajan con él.
  // ---------------------------------------------------------------------
  {
    files: [
      'src/{features,router,hooks,store,api,services}/**/*.{ts,tsx}',
      'src/components/*.{ts,tsx}',
      'src/main.tsx',
    ],
    ignores: ['src/components/icons.ts', 'src/hooks/useAppForm.ts'],
    rules: { 'no-restricted-imports': ['error', { paths: [...UI_IMPORTS, FORM_IMPORT] }] },
  },
  // El envoltorio es el único que llama a `useForm`.
  {
    files: ['src/hooks/useAppForm.ts'],
    rules: { 'no-restricted-imports': ['error', { paths: UI_IMPORTS }] },
  },

  // ---------------------------------------------------------------------
  // Fuentes unicas: rutas, permisos, claves de consulta, colores, roles,
  // almacenamiento, red y el esquema generado.
  //
  // Cada dato vive en un solo modulo (ver SYNTAX_SOURCES arriba) y fuera de el
  // un literal es una copia que se desfasa. Los bloques de mas abajo dejan
  // fuera de cada grupo al modulo que es dueño de esa fuente. Las pruebas
  // pueden escribir los literales: asi comprueban lo que ve el usuario.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept() },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('queryKeys') },
  },
  {
    files: ['src/api/permissions.ts'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('queryKeys', 'permissions') },
  },
  {
    files: ['src/api/types.ts'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('queryKeys', 'apiSchema') },
  },
  {
    files: ['src/services/**/*.{ts,tsx}', 'src/store/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('storage') },
  },
  {
    files: ['src/services/paths.ts'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('storage', 'routes') },
  },
  {
    files: ['src/services/api.ts', 'src/services/eventStream.ts'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('storage', 'network') },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/components/printSheet.ts'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('colors') },
  },
  {
    files: ['src/features/roles/**/*.{ts,tsx}', 'src/features/staff/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': restrictSyntaxExcept('roles') },
  },

  // ---------------------------------------------------------------------
  // Nombrado de carpetas y archivos.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE' },
      ],
      'check-file/filename-naming-convention': [
        'error',
        {
          // Componentes y vistas en PascalCase, porque nombran un componente.
          'src/components/*.tsx': 'PASCAL_CASE',
          'src/features/**/*.tsx': 'PASCAL_CASE',
          // Todo lo demas nombra un modulo, no un componente.
          'src/{api,hooks,services,store}/**/*.ts': 'CAMEL_CASE',
          'src/components/*.ts': 'CAMEL_CASE',
          'src/features/**/*.ts': 'CAMEL_CASE',
          // shadcn/ui genera sus archivos en kebab-case y `shadcn add` los
          // reescribe con ese nombre al actualizarlos. Renombrarlos a mano
          // romperia cada actualizacion, asi que la carpeta tiene su propia
          // convencion en vez de una excepcion.
          'src/components/ui/**/*.{ts,tsx}': 'KEBAB_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/no-index': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // Limites de arquitectura entre capas.
  //
  // La direccion de dependencia es una sola: la composicion conoce a las
  // caracteristicas, las caracteristicas no se conocen entre si, y las capas
  // compartidas no conocen el dominio.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // Sin este resolutor, las importaciones sin extension no se resuelven y
      // todas las reglas de limites quedan inertes sin avisar.
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      // Se incluye TODO src. Listar las capas una por una dejaba fuera del
      // analisis cualquier carpeta nueva: un src/utils/ recien creado no era
      // una violacion, era invisible, y todas las capas podian importarlo.
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      // La raiz de composicion se declara por archivo y no por carpeta, que
      // es para lo que sirven los descriptores de fichero. Antes estaba en la
      // lista de ignorados, que es otra cosa: un archivo ignorado no tiene
      // reglas, y este las tiene, solo que amplias.
      //
      // Es un unico archivo: main.tsx. El armazon de la interfaz vive en
      // components porque es lo que es, un componente compartido, y asi el
      // router puede usarlo sin romper la direccion de dependencia.
      'boundaries/files': [{ pattern: 'src/main.tsx', category: 'composition' }],
      // El patron nombra la carpeta raiz del elemento, no sus archivos.
      'boundaries/elements': [
        { type: 'router', pattern: 'src/router' },
        { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'components', pattern: 'src/components' },
        { type: 'hooks', pattern: 'src/hooks' },
        { type: 'store', pattern: 'src/store' },
        { type: 'api', pattern: 'src/api' },
        { type: 'services', pattern: 'src/services' },
      ],
    },
    rules: {
      // Rechaza importar un archivo bajo src que no pertenece a ninguna capa
      // declarada. Desde la version 7 esta regla absorbio a 'no-unknown'.
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // El mensaje del rechazo. Va aqui y no en cada politica: las
          // politicas son de permiso, asi que su `message` no llegaba nunca a
          // mostrarse.
          message:
            'La capa "{{from.element.types.[0]}}" no puede depender de "{{to.element.types.[0]}}". La direccion de dependencia esta en el README: sube lo compartido a components, hooks o api.',
          policies: [
            {
              // Su trabajo es precisamente conocer todas las capas para
              // ensamblarlas, asi que las alcanza a todas. Va enumerado y no
              // con un comodin para que se lea que toca.
              from: [{ file: { categories: 'composition' } }],
              allow: [
                { to: { element: { type: 'router' } } },
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'store' } } },
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } } },
              ],
            },
            {
              // Ademas de las pantallas, el registro de pantallas lee las rutas
              // (services) y los permisos con nombre (api).
              from: [{ element: { type: 'router' } }],
              allow: [
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } } },
              ],
            },
            {
              // Una caracteristica solo puede importarse a si misma.
              from: [{ element: { type: 'features' } }],
              allow: [
                { to: { element: { type: 'features', captured: { feature: '{{from.feature}}' } } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'store' } } },
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } } },
              ],
            },
            {
              from: [{ element: { type: 'components' } }],
              allow: [
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'hooks' } } },
                // Solo el texto de un error del API (`errorMessage`), que usa `ErrorMessage`.
                { to: { element: { type: 'services' }, file: { path: 'src/services/apiError.ts' } } },
              ],
            },
            {
              from: [{ element: { type: 'hooks' } }],
              allow: [
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } } },
              ],
            },
            {
              from: [{ element: { type: 'store' } }],
              allow: [
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } } },
              ],
            },
            {
              from: [{ element: { type: 'api' } }],
              allow: [
                { to: { element: { type: 'api' } } },
                { to: { element: { type: 'services' } } },
              ],
            },
            {
              // Los servicios no conocen la capa api, salvo por los tipos del
              // contrato (`ErrorCode` en el error del cliente HTTP): un `import type` no
              // trae código a la ejecución ni crea un ciclo.
              from: [{ element: { type: 'services' } }],
              allow: [
                { to: { element: { type: 'services' } } },
                { to: { element: { type: 'api' } }, dependency: { kind: 'type' } },
              ],
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Importaciones: ciclos, duplicados y dependencias.
  //
  // Sin `import-x/extensions` y `resolver-next`, no-cycle no resuelve las
  // rutas de un proyecto TS y reporta 0 siempre (falso verde).
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/extensions': ['.ts', '.tsx', '.js'],
      'import-x/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.json' })],
    },
    rules: {
      'import-x/no-cycle': ['error', { maxDepth: Infinity }],
      'import-x/no-duplicates': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{ts,tsx}',
            'jest/**',
            'e2e/**',
            'checks/**',
            'scripts/**',
            '*.config.{js,ts,mjs}',
            'src/api/contract/**',
            'vite.*.ts',
          ],
        },
      ],
      'import-x/no-restricted-paths': ['error', { basePath: import.meta.dirname, zones: siblingFolderZones }],
      'import-x/no-mutable-exports': 'error',
      // Un solo nombre por simbolo: renombrar y buscar usos es seguro. Los
      // archivos que una herramienta carga por default estan mas abajo.
      'import-x/no-default-export': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
    },
  },

  // Un archivo de producción que importa de más de 12 módulos hace demasiado:
  // se parte en piezas. Las pruebas importan lo que prueban y sus ayudantes.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'src/api/contract/**'],
    plugins: { 'import-x': importX },
    rules: { 'import-x/max-dependencies': ['error', { max: 12 }] },
  },

  // ---------------------------------------------------------------------
  // Rutas de importación: dentro de src, todo lo que no esté en la misma
  // carpeta se importa con el alias @/. Así un import no depende de la
  // profundidad del archivo y mover o renombrar una carpeta no obliga a
  // reescribir los `../../..` de quien la usa.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'no-relative-import-paths': noRelativeImportPaths },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: true, rootDir: 'src', prefix: '@' },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Accesibilidad en el JSX (jsx-a11y en modo estricto).
  // ---------------------------------------------------------------------
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // Un bloque desplazable (traceback, JSON) debe poder enfocarse para
      // desplazarse con teclado; si es una region con nombre, es valido.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'], tags: [] }],
      // Safari/VoiceOver deja de anunciar como lista un <ul> con `list-style: none`:
      // ahí el role="list" explícito no es redundante.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
    },
  },

  // ---------------------------------------------------------------------
  // TanStack Query: claves exhaustivas, queryOptions como fuente unica.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@tanstack/query': pluginQuery },
    rules: {
      ...pluginQuery.configs['flat/recommended'][0].rules,
      '@tanstack/query/prefer-query-options': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // TypeScript: reglas que strictTypeChecked no trae.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { requireDefaultForNonUnion: true }],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-use-before-define': ['error', {
          functions: false,
          classes: true,
          // Un cierre puede nombrar una constante declarada despues (los
          // almacenes de sesion y su temporizador de vencimiento se necesitan
          // mutuamente); el uso en el mismo ambito antes de declarar sigue
          // prohibido, y tsc ya marca el acceso real antes de inicializar.
          variables: false,
        }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/method-signature-style': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // Efectos innecesarios.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.tsx', 'src/**/use*.ts'],
    ...reactEffect.configs.recommended,
    rules: Object.fromEntries(
      Object.keys(reactEffect.configs.recommended.rules ?? {}).map((rule) => [rule, 'error']),
    ),
  },

  // ---------------------------------------------------------------------
  // Comentarios.
  //
  // La regla del proyecto es que un comentario solo se gana su lugar si dice
  // algo que el codigo no puede decir. Eso no se puede verificar con una
  // herramienta, asi que el linter cubre la higiene y la regla escrita cubre
  // el resto. Esta en el README.
  // ---------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Un comentario al final de una linea de codigo se lee mal y envejece
      // sin que nadie lo note. Va arriba, en su propia linea.
      'no-inline-comments': 'error',
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      // Un bloque de varias lineas se escribe con barras dobles. Los bloques
      // /** */ quedan reservados para documentar un contrato publico, que es
      // lo que lee el editor al pasar el cursor.
      'multiline-comment-style': ['error', 'separate-lines', { checkJSDoc: false }],
      // Una tarea pendiente vive en el gestor de incidencias. sonarjs/todo-tag
      // ya cubre TODO; esto agrega el resto de las marcas.
      'no-warning-comments': [
        'error',
        { terms: ['fixme', 'xxx', 'hack'], location: 'start' },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Directivas que desactivan reglas.
  //
  // No se prohiben del todo: prohibirlas empuja la excepcion al archivo de
  // configuracion, donde vale para el proyecto entero y es mucho peor. Se
  // exige que sean estrechas y que digan por que, que es la misma vara que
  // el resto del proyecto aplica a las excepciones.
  // ---------------------------------------------------------------------
  comments.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@eslint-community/eslint-comments/require-description': [
        'error',
        { ignore: [] },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Barrel files: un archivo que solo reexporta.
  //
  // Enturbian los limites, esconden dependencias circulares y hacen que un
  // import arrastre modulos que nadie pidio. Cada modulo se importa por su
  // ruta real.
  // ---------------------------------------------------------------------
  ...noBarrelFiles.configs['flat/recommended'],
  // La excepción es el registro de iconos: es la única puerta a Lucide y la
  // cruza reexportando. Con un reexport, el empaquetador lleva cada icono
  // directo al archivo de la pantalla que lo dibuja; con un objeto o una
  // constante por icono, todos quedarían donde vive el registro, que es el
  // archivo inicial.
  {
    files: ['src/components/icons.ts'],
    rules: { 'no-barrel-files/no-barrel-files': 'off' },
  },

  // ---------------------------------------------------------------------
  // Archivos de configuracion.
  // ---------------------------------------------------------------------
  {
    files: ['*.config.{js,ts,mjs}', 'eslint.config.js', 'jest/**/*.cjs'],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'check-file/filename-naming-convention': 'off',
      // Vite, Jest, Playwright, Stryker y ESLint leen la configuracion del
      // export default del archivo; no admiten un export con nombre.
      'import-x/no-default-export': 'off',
    },
  },
  // Playwright carga el reporter como `export default class`.
  {
    files: ['e2e/support/reportCoverage.ts'],
    rules: { 'import-x/no-default-export': 'off' },
  },
  // ---------------------------------------------------------------------
  // Scripts de medición de accesibilidad (Node, fuera de la aplicación).
  // ---------------------------------------------------------------------
  {
    files: ['checks/accessibility/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    extends: [tseslint.configs.disableTypeChecked],
  },
  // ---------------------------------------------------------------------
  // Herramientas de línea de comandos (Node, scripts/): la huella de carbono.
  // ---------------------------------------------------------------------
  {
    files: ['scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // ---------------------------------------------------------------------
  // Pruebas de extremo a extremo y visuales (Playwright, e2e/).
  //
  // Corren en Node y describen recorridos largos de la interfaz. Se lintean
  // con las mismas reglas salvo cuatro: un recorrido es una sola función
  // larga a propósito (se lee de arriba abajo como la historia que prueba),
  // los textos de la interfaz se repiten porque son lo que se busca en la
  // pantalla, los accesorios de Playwright se declaran con `{}` vacío, y
  // `test.describe` + `test` + `step` suman un nivel más de callbacks.
  // ---------------------------------------------------------------------
  {
    files: ['e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'sonarjs/no-duplicate-string': 'off',
      'no-empty-pattern': 'off',
      'max-nested-callbacks': ['error', 4],
    },
  },
  {
    // Lo que Jest carga como CommonJS: el entorno, el plugin de Babel y los módulos sustitutos.
    files: ['jest/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // ---------------------------------------------------------------------
  // Pruebas: buenas prácticas de Testing Library y de jest-dom, solo sobre
  // los archivos de prueba (consultas por rol, esperas con `findBy`, sin
  // `container.querySelector`, aserciones que dicen lo que miden).
  // ---------------------------------------------------------------------
  {
    ...testingLibrary.configs['flat/react'],
    files: ['src/**/*.test.{ts,tsx}'],
  },
  {
    ...jestDom.configs['flat/recommended'],
    files: ['src/**/*.test.{ts,tsx}'],
  },

  // ---------------------------------------------------------------------
  // La red de las pruebas es MSW (`jest/mswServer.ts`).
  //
  // Una prueba que reemplaza con `jest.mock` una función de `src/api` o el
  // cliente `src/services/api` deja sin ejercitar justo lo que el usuario
  // depende de que funcione: la ruta, el cuerpo y el tratamiento del error. Se
  // declara la respuesta del servidor con `server()` de `#jest/harness`, o con
  // `apiHttp` de `#jest/apiHttp` (tipada con el contrato), y pasa por el
  // cliente real.
  //
  // Una excepción va por archivo, en MOCKS_OF_API_ALLOWED, con su motivo al lado.
  // Hoy no hay ninguna.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.test.{ts,tsx}'],
    ignores: MOCKS_OF_API_ALLOWED,
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: String.raw`CallExpression[callee.object.name='jest'][callee.property.name=/^(mock|doMock|unstable_mockModule|setMock)$/][arguments.0.value=/^@\x2F(api(\x2F|$)|services\x2Fapi$)/]`,
          message:
            'No se simula con jest.mock el API ni el cliente HTTP: declara la respuesta con MSW (server() de #jest/harness o apiHttp de #jest/apiHttp) para ejercitar el cliente real.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Unicorn, solo un subconjunto: reglas que cazan errores o idiomas viejos
  // y que se corrigen solas. Quedan fuera las de estilo personal y las que
  // chocan con el proyecto: `filename-case` (check-file ya fija los nombres),
  // `prevent-abbreviations` (cspell + naming-convention ya cubren los nombres),
  // `no-null` (el contrato del API usa null), `no-array-reduce`/`no-nested-ternary`,
  // `prefer-global-this` (`window.setTimeout` devuelve `number` y `globalThis.setTimeout`,
  // `Timeout`: rompe los tipos del navegador) y `no-useless-undefined` (reescribe
  // `() => undefined` como una función vacía, que `no-empty-function` prohíbe).
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'jest/**/*.ts', 'scripts/**/*.ts'],
    plugins: { unicorn },
    rules: {
      // `node:fs` y no `fs`: el prefijo deja claro que es del núcleo de Node.
      'unicorn/prefer-node-protocol': 'error',
      // `replaceAll` dice lo que hace; `replace(/x/g)` esconde la bandera.
      'unicorn/prefer-string-replace-all': 'error',
      // `forEach` no se puede cortar ni espera promesas; `for...of` sí.
      'unicorn/no-for-each': 'error',
      // `at(-1)` y no `arr[arr.length - 1]`.
      'unicorn/prefer-at': 'error',
      // Copiar con spread algo que ya es un arreglo nuevo es ruido.
      'unicorn/no-useless-spread': 'error',
      // Un `Error` se crea con `new`, y con mensaje.
      'unicorn/throw-new-error': 'error',
      'unicorn/error-message': 'error',
      // Las llaves en cada `case` evitan que una declaración se filtre a otro.
      'unicorn/switch-case-braces': 'error',
      // `Number.isNaN` y `Number.parseInt`, no las globales con coerción.
      'unicorn/prefer-number-properties': 'error',
      // Lo que dice la intención: `includes`, `some`, `startsWith`/`endsWith`.
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      // Un `catch` que no usa el error no lo declara.
      'unicorn/prefer-optional-catch-binding': 'error',
      // `typeof x === 'undefined'` es `x === undefined` con tipos.
      'unicorn/no-typeof-undefined': 'error',
      // Los constructores nativos: `new Map()` pero `String(x)`.
      'unicorn/new-for-builtins': 'error',
      // `instanceof Array` falla entre marcos; `Array.isArray` no.
      'unicorn/no-instanceof-builtins': 'error',
      // `structuredClone` y no `JSON.parse(JSON.stringify())`.
      'unicorn/prefer-structured-clone': 'error',
      // Un solo `push` con varios valores, no varios seguidos.
      'unicorn/no-array-push-push': 'error',
    },
  },

  // ---------------------------------------------------------------------
  // Identificadores en inglés (comentarios, textos de interfaz, descripciones
  // de pruebas y mensajes de commit siguen en español).
  //
  // `@cspell/eslint-plugin` revisa solo identificadores: ni cadenas, ni
  // plantillas, ni comentarios, ni texto JSX. Diccionario inglés + términos de
  // software; lo que no es inglés pero se queda (siglas legales, nombres de
  // platos, marcas, nombres propios de los datos de prueba) vive en
  // `cspell-terms.txt`.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'jest/**/*.{ts,cjs}', 'checks/**/*.mjs', 'scripts/**/*.ts', '*.config.{js,ts,mjs}', 'vite.plugins.ts'],
    plugins: { '@cspell': cspell },
    rules: {
      '@cspell/spellchecker': [
        'error',
        {
          checkIdentifiers: true,
          checkStrings: false,
          checkStringTemplates: false,
          checkComments: false,
          checkJSXText: false,
          autoFix: false,
          numSuggestions: 0,
          cspell: {
            language: 'en',
            import: [
              '@cspell/dict-software-terms/cspell-ext.json',
              '@cspell/dict-typescript/cspell-ext.json',
              '@cspell/dict-node/cspell-ext.json',
              '@cspell/dict-html/cspell-ext.json',
              '@cspell/dict-css/cspell-ext.json',
            ],
            dictionaryDefinitions: [{ name: 'resthub-terms', path: fileURLToPath(new URL('./cspell-terms.txt', import.meta.url)) }],
            dictionaries: ['resthub-terms'],
          },
        },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Convenciones de nombres (@typescript-eslint/naming-convention).
  //
  // camelCase para variables, funciones y parámetros; PascalCase para tipos y
  // componentes; UPPER_CASE para las constantes de módulo; los booleanos
  // llevan prefijo de pregunta y los hooks empiezan con `use`. Las claves de
  // objetos y de tipos no se revisan: son las del API (snake_case), las del DOM
  // (`aria-*`, `data-*`) o las de librerías.
  // ---------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'jest/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
        { selector: 'import', format: null },
        // PascalCase en variables: los componentes de React (`const Icon = icons[name]`).
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        // Los booleanos son preguntas: isOpen, hasItems, canCharge, shouldRetry, wasPaid, willExpire.
        { selector: 'variable', types: ['boolean'], format: ['PascalCase'], prefix: ['is', 'has', 'can', 'should', 'was', 'will'] },
        { selector: 'variable', types: ['boolean'], modifiers: ['global', 'const'], format: ['PascalCase', 'UPPER_CASE'], prefix: ['is', 'has', 'can', 'should', 'was', 'will', 'IS_', 'HAS_', 'CAN_', 'SHOULD_', 'WAS_', 'WILL_'] },
        // Lo que se desestructura trae el nombre de quien lo declaró (props de React, respuestas de librerías).
        { selector: ['variable', 'parameter'], modifiers: ['destructured'], format: null },
        { selector: ['variable', 'parameter'], types: ['boolean'], modifiers: ['destructured'], format: null },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // Un hook es `useAlgo`.
        { selector: 'function', filter: { regex: '^use', match: true }, format: null, custom: { regex: '^use[A-Z0-9]', match: true } },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]|Dto$', match: false } },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        // Claves del API (snake_case), del DOM y de librerías: no son nuestras.
        { selector: ['objectLiteralProperty', 'typeProperty', 'objectLiteralMethod', 'classProperty', 'classMethod', 'accessor'], format: null },
      ],
    },
  },

)
