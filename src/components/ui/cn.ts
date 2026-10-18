// `cn` con las tablas de este proyecto. El paquete trae las de todo Tailwind
// (unos 5 kB comprimidos en el bundle principal); `cn build` deja solo los
// grupos de clases que usan los fuentes (unos 3 kB). El alias `cn` de
// vite.config.ts y de jest.config.js apunta aquí, así que los componentes de
// shadcn siguen importando `cn` como lo generan.
//
// `cn-tables.mjs` lo regenera el plugin `cn/vite` al compilar o al cambiar un
// fuente; a mano: `pnpm exec cn build --content 'src/**/*.{ts,tsx}' --content
// index.html --out src/components/ui/cn-tables.mjs --no-css`. Sin leer el
// `@theme` de index.css combina igual que el paquete completo. Una clase
// armada en tiempo de ejecución (`'p-' + tamaño`) no se ve al escanear: va
// completa en el fuente.
import { createCn } from 'cn/engine'

import tables from './cn-tables.mjs'

export const cn = createCn(tables)
