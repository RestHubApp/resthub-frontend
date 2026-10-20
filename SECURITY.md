# Política de seguridad

Cómo reportar una vulnerabilidad del frontend de RestHub y en qué plazo se corrige
(OWASP ASVS 5.0, V15.1.1 y V15.2.1). Los plazos y las reglas son los del backend:
[`SECURITY.md` de resthub-backend](https://github.com/RestHubApp/resthub-backend/blob/develop/SECURITY.md).

## Reportar una vulnerabilidad

- **En privado, nunca en un issue público ni en un PR.** Pestaña *Security* del
  repositorio → *Report a vulnerability*. Si la opción no aparece, escribe a un
  miembro del equipo por un canal privado y pídele que abra el advisory.
- Incluye qué pantalla o archivo, cómo reproducirlo, qué datos quedan expuestos y
  desde qué versión (`CHANGELOG.md`).
- No pruebes contra producción con datos reales: usa el entorno local o el local de
  muestra.
- El equipo confirma la recepción en **2 días hábiles**.

## Plazos de remediación

Valen igual para el código propio y para las dependencias de npm. Corren desde que el
equipo conoce el problema: el reporte, el advisory o el fallo del CI.

| Severidad | CVSS | Plazo |
|---|---|---|
| Crítica | 9,0 – 10,0 | 72 horas |
| Alta | 7,0 – 8,9 | 7 días |
| Media | 4,0 – 6,9 | 30 días |
| Baja | 0,1 – 3,9 | 90 días |

## Cómo se revisan las dependencias

- **En cada push y PR** (`.github/workflows/ci.yml`, job `frontend`):
  `pnpm audit --audit-level high`. Una vulnerabilidad alta o crítica bloquea la
  integración.
- **Cada semana** (`.github/workflows/auditoria-dependencias.yml`, lunes 08:17 UTC y a
  mano desde Actions): el mismo `pnpm audit`, aunque nadie toque el código. Su fallo
  es el inicio del plazo.
- **Dependabot**: PR de npm y de las acciones de GitHub contra `develop`. Una
  corrección de seguridad no espera al PR: se actualiza a mano, o con un `override`
  en `pnpm-workspace.yaml`, dentro del plazo de su severidad.

## Excepciones

Cuando no se puede corregir a tiempo (no hay versión arreglada, o el arreglo rompe
algo), la excepción queda escrita aquí con fecha de vencimiento, en el mismo PR que la
introduce, además de en `auditConfig.ignoreGhsas` de `pnpm-workspace.yaml` con el
comentario `# Excepción hasta AAAA-MM-DD, ver SECURITY.md`. El vencimiento no pasa del
plazo de la severidad; si no existe versión corregida, 30 días y se vuelve a revisar.
Al vencer se renueva con un motivo nuevo (otra fila) o se corrige: una excepción
vencida cuenta como una vulnerabilidad abierta con el plazo cumplido.

| ID | Paquete | Severidad | Motivo y mitigación | Alta | Vence | Responsable |
|---|---|---|---|---|---|---|
| GHSA-vfj7-8cjw-p6xm | `braces` ≤ 3.0.3 | Alta | Sin versión corregida. Solo llega por `micromatch` y `fast-glob` en herramientas de desarrollo (`eslint-plugin-boundaries`, `eslint-plugin-check-file`, la CLI de shadcn, `type-coverage`), que expanden patrones del propio repositorio; nada de eso va en la compilación que se publica. | 2026-10-05 | 2026-11-04 | Equipo RestHub |
