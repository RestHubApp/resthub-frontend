// Los límites de las contraseñas, aparte de las reglas de Zod: el acceso los
// necesita y no debe cargar Zod solo por dos números. Repiten los del backend.
export const MIN_PASSWORD = 10
export const MAX_PASSWORD = 128
