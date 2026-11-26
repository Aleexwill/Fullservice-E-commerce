# Marcación en terreno (PWA `/marcacion`)

App instalable (solo esta sección del sitio) para marcar jornada con rostro y GPS, registrar traslados y
verificar el equipo de seguridad (EPP) con aprobación de un encargado.

## Pantallas
| Ruta | Quién | Qué hace |
|---|---|---|
| `/marcacion` | Todos los usuarios | Jornada guiada paso a paso |
| `/marcacion/aprobaciones` | Roles con `canAprobarPresupuestos` (admin, gerencia, administración, planner) | Revisa la foto de EPP, aprueba o rechaza |
| `/marcacion/sitios` | Roles con `canManageConfig` (admin, administración) | Alta de oficina y lugares con radio |
| `/marcacion/login` | — | Mismo usuario y contraseña del admin |

## Flujo y reglas (validadas en el servidor)
`INGRESO` (rostro + GPS en oficina) → `TRASLADO_IDA` (GPS) → `LLEGADA_LUGAR` (GPS dentro del radio) →
foto EPP → aprobación → `SALIDA_LUGAR` → `LLEGADA_OFICINA` (GPS en oficina) → `SALIDA` (rostro + GPS en oficina).

- Cada marca solo es válida desde el estado anterior (`src/app/api/marcacion/marcas/route.ts`, tabla `FLUJO`).
- El radio se calcula en el servidor. `MARCACION_GEOFENCE=warn` guarda la marca como "fuera de rango" en vez de rechazarla.
- GPS con precisión peor a 150 m se rechaza.
- Aprobar exige todos los elementos del EPP confirmados; nadie aprueba su propia foto.
- Una jornada por persona y día (`@@unique([userKey, fecha])`, zona America/Asuncion).

## PWA
- `public/marcacion/manifest.webmanifest`: `scope` y `start_url` `/marcacion/`. Solo el layout de `/marcacion` lo enlaza.
- `public/marcacion/sw.js`: alcance `/marcacion/`; no cachea `/api` ni fotos.
- `src/middleware.ts` protege `/marcacion/*` (excepto login, manifest y sw). `PublicShell` y `PageTracker` la excluyen.
- Cámara y GPS exigen HTTPS (Vercel lo da).

## Pendientes conocidos
- **Verificación de rostro**: hoy la selfie se guarda como evidencia (`src/lib/marcacion/face.ts`, modo `evidencia`).
  Para verificar identidad hay que conectar un proveedor en `verificarRostro`.
- Sin modo offline: marcar requiere conexión.
- Sin notificaciones push al encargado (la lista se actualiza cada 10 s).
- Una sola oficina activa (la primera); un solo destino por jornada.
- Coordenadas de la oficina por defecto son aproximadas: ajustarlas en `/marcacion/sitios`.
- Foto EPP y selfies: con `BLOB_READ_WRITE_TOKEN` van a Vercel Blob (URL pública); sin token se guardan en la base.

## Deploy
`npm run vercel-build` aplica la migración `16_add_marcacion` (crea tablas y la oficina por defecto).
