# Marcación en terreno (PWA `/marcacion`)

App instalable (solo esta sección del sitio) para marcar jornada con rostro y GPS, registrar traslados y
verificar el equipo de seguridad (EPP) con aprobación de un encargado.

## Pantallas
| Ruta | Quién | Qué hace |
|---|---|---|
| `/marcacion` | Todos los usuarios | Jornada guiada paso a paso |
| `/marcacion/aprobaciones` | Roles con `canAprobarPresupuestos` (admin, gerencia, administración, planner) | Revisa la foto de EPP, aprueba o rechaza |
| `/marcacion/ausencias` | Todos (los encargados además resuelven y registran por otros) | Vacaciones, permisos, reposos y licencias; saldo de vacaciones |
| `/marcacion/reportes` | Roles con `canViewReports` | Hoy en vivo, resumen por persona, detalle por día, exportar CSV |
| `/marcacion/reportes` → PDF | Roles con `canViewReports` | `GET /api/marcacion/reportes/pdf?mes=YYYY-MM[&userKey=]`: A4 apaisado, una hoja por persona con calendario completo, totales y firmas |
| `/marcacion/parametros` | Roles con `canManageConfig` | Horario por día, tolerancia, almuerzo, extras, vacaciones, quién marca, horario propio, feriados |
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

## Parámetros y reglas de cálculo (`src/lib/marcacion/reglas.ts`)
- **Horario por día** (entrada/salida y si es laboral), general o propio de cada persona. Por defecto: lun-vie 08:00-17:00, sáb 08:00-13:00.
- **Tardanza**: entrada posterior a la prevista + tolerancia. **Salida anticipada**: igual en la salida.
- **Almuerzo**: se marca con GPS (iniciar/volver) en cualquier momento de la jornada. Si no se marca y está activo el descuento automático, se resta la duración prevista en jornadas de 5 h o más.
- **Horas trabajadas** = salida − entrada − almuerzo. **Horas extra** = exceso sobre lo previsto si llega al mínimo configurado; en día no laboral o feriado todo cuenta como extra.
- **Traslado** y **tiempo en el lugar** salen de las marcas de ida/vuelta y llegada/salida del lugar.
- **Ausente** (automático): día laboral pasado, sin feriado, sin marca y sin ausencia aprobada. Los días con ausencia aprobada se muestran como Vacaciones, Permiso, Reposo médico o Licencia.
- **Quién marca**: por rol (por defecto `tecnico`), con excepción por persona.
- Vacaciones: saldo = días anuales − días hábiles aprobados del año (sin feriados). Los días anuales salen de la antigüedad (12 / 18 / 30 días a 0-5 / 5-10 / +10 años) cuando se conoce la fecha de ingreso; si no, del parámetro general.
- **Antigüedad**: sale de la ventana de funcionarios (`/admin/funcionarios`, tabla `Funcionario`), enlazada al usuario del sistema por `Funcionario.userId` = `User.id` (único y opcional; sin FK). Se lee en un solo lugar, `src/lib/marcacion/funcionarios.ts` (`obtenerFechasIngreso`, solo funcionarios activos). Se muestra en Parámetros > Personas, en el saldo de vacaciones y en el PDF mensual.
- Feriados de Paraguay 2026-2027 precargados; se editan en Parámetros.

## Funcionarios (`/admin/funcionarios`)
Ventana del admin para personal con fecha de ingreso (permiso `canManageUsers`: admin y administración). Alta, edición, baja lógica
(conserva historial) y enlace opcional a un usuario del sistema (solo se ofrecen usuarios sin funcionario). Calcula antigüedad en años
y meses, días de vacaciones que corresponden y fecha del próximo tramo. Los cambios quedan en el Log de cambios (entidad `Funcionario`).
Migraciones `18_add_funcionario` y `19_rostro_plantilla`. Si se unifica con otra versión del modelo, adaptar `src/lib/marcacion/funcionarios.ts` y `src/lib/funcionarios-store.ts`.

## Reconocimiento facial (ingreso y salida)
**No se guarda ninguna imagen del rostro.** Se enrola una vez y cada ingreso/salida se compara con esa primera huella.
- **Enrolamiento** (`/admin/funcionarios` > "Enrolar rostro", requiere consentimiento marcado): 3 capturas de frente con la cámara del dispositivo.
  Solo se guarda la huella numérica (3 vectores de 128 valores, tabla `RostroPlantilla`, enlazada por `User.id`). Se borra al dar de baja al funcionario o con "Borrar".
- **Cada marca de ingreso/salida:** el teléfono calcula la huella de la cara (librería `@vladmandic/face-api`, modelos en `public/marcacion/models`, ~6,7 MB, sin imágenes ni datos a terceros)
  y envía solo ese vector. El servidor lo compara con la plantilla y decide con umbrales de Parámetros > Reconocimiento facial.
- **Resultados:** `VERIFICADO` (pasa) · `DUDOSO` (pasa y queda señalada como "Rostro dudoso" en el reporte y el PDF) · `RECHAZADO` (no marca) ·
  `SIN_PLANTILLA` (no está enrolado: marca y queda señalada; con "Exigir rostro enrolado" no puede marcar). La distancia de cada marca queda en `Marca.rostroScore`.
- **Prueba de vida:** antes de la huella se pide un gesto al azar (parpadear, o girar la cabeza) y se exige *ver* el movimiento, así una foto fija no pasa. Ocurre en el teléfono.
- **Umbrales** (distancia entre huellas; menor = más parecido): estricta 0,35/0,45 · normal 0,40/0,50 · flexible 0,45/0,55 (verificado / rechazo).
  Calibrados con caras reales de prueba: la misma cara con cambios de luz, tamaño e inclinación llegó a 0,42; personas distintas, desde 0,47.
  Con 420 pares de personas distintas: ninguna fue "verificada" en ningún nivel; en "normal" 1 % cayó en dudosa. **Hay que ajustarlo con uso real** (revisar `rostroScore`).
- **Límites:** sin imágenes guardadas, el encargado no puede revisar visualmente una marca dudosa (solo ve la alerta); la huella la calcula el teléfono, por lo que un usuario técnico
  podría manipularla; la prueba de vida frena fotos pero no un video de la persona. Para mayor seguridad, cambiar `verificarRostro` por un proveedor (AWS Rekognition, etc.).
- **Datos sensibles:** pedir consentimiento por escrito y definir cuánto se conserva la huella.

## PWA
- `public/marcacion/manifest.webmanifest`: `scope` y `start_url` `/marcacion/`. Solo el layout de `/marcacion` lo enlaza.
- `public/marcacion/sw.js`: alcance `/marcacion/`; no cachea `/api` ni fotos.
- `src/middleware.ts` protege `/marcacion/*` (excepto login, manifest y sw). `PublicShell` y `PageTracker` la excluyen.
- Cámara y GPS exigen HTTPS (Vercel lo da).

## Pendientes conocidos
- **Verificación de rostro**: hoy la selfie se guarda como evidencia (`src/lib/marcacion/face.ts`, modo `evidencia`).
  Para verificar identidad hay que conectar un proveedor en `verificarRostro`.
- Vacaciones por antigüedad: tramos fijos 12/18/30 (`TRAMOS_VACACIONES` en `reglas.ts`); sin arrastre de saldo entre años ni proporcional en el primer año.
- Las horas se calculan al consultar el reporte con los parámetros vigentes: cambiar el horario recalcula también el pasado.
- Sin modo offline: marcar requiere conexión.
- Sin notificaciones push al encargado (la lista se actualiza cada 10 s).
- Una sola oficina activa (la primera); un solo destino por jornada.
- Coordenadas de la oficina por defecto son aproximadas: ajustarlas en `/marcacion/sitios`.
- Foto EPP y selfies: con `BLOB_READ_WRITE_TOKEN` van a Vercel Blob (URL pública); sin token se guardan en la base.

## Deploy
`npm run vercel-build` aplica las migraciones `16_add_marcacion` (tablas y oficina por defecto) y `17_marcacion_parametros` (almuerzo, parámetros, feriados y ausencias) y `18_add_funcionario`.
