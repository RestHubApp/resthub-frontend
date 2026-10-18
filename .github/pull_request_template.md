## Qué cambia

<!-- Qué hace este PR y por qué. Enlaza el requisito (RFS-xx, RNFS-xx) o el issue. -->

## Cómo se probó

<!-- Pruebas nuevas o cambiadas, y lo que corriste en local. -->

- [ ] `pnpm typecheck && pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build && pnpm size`
- [ ] `pnpm test:e2e` si cambia una pantalla, y `pnpm e2e:inventory` si agrega un diálogo u hoja

## Privacidad (PI-04)

- [ ] Ningún log, aviso, error ni evento de analítica nuevo lleva datos personales en claro
      (correo, teléfono, documento, dirección, IP completa, contraseñas, tokens).
- [ ] Nada personal ni ningún token se guarda en `localStorage`, `sessionStorage` ni en la
      dirección (query string o hash) más allá de lo que ya está documentado.
- [ ] Los datos de prueba, fixtures y capturas son inventados: nada se copió de producción.
- [ ] Si una pantalla nueva muestra datos personales, solo los ve quien tiene el permiso.

## Seguridad

- [ ] Las pantallas y acciones nuevas piden su permiso (`PERMISSION.*`); el servidor sigue
      siendo quien autoriza.
- [ ] No se agregan scripts ni estilos de terceros fuera de lo que permite la CSP.
