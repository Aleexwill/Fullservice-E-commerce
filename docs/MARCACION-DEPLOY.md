# Llevar marcación y funcionarios al servidor

Todo el trabajo está en la rama `claude/optimistic-euler-5wkeqd` (sin PR abierto). No se compiló nada para entregarlo:
los archivos generados (`.next`, `node_modules`) están ignorados por git y no forman parte de la rama.

## 1. Traer el código
```bash
git fetch origin
git checkout claude/optimistic-euler-5wkeqd
npm install
```
`npm install` instala dos dependencias nuevas: `pdf-lib` (PDF mensual) y `@vladmandic/face-api` (reconocimiento facial en el teléfono, MIT).

## 2. Qué se agrega
| Área | Dónde |
|---|---|
| PWA de marcación (páginas) | `src/app/marcacion/*` (jornada, ausencias, aprobaciones, reportes, parámetros, sitios, login) |
| APIs de marcación | `src/app/api/marcacion/*` |
| Lógica de marcación | `src/lib/marcacion/*` (reglas de cálculo, servidor, PDF, enlace a funcionarios) |
| Componentes y estilos | `src/components/marcacion/*`, `src/styles/marcacion.css` |
| Archivos de la PWA | `public/marcacion/` (manifest, service worker, íconos) y `public/marcacion/models/` (3 modelos de reconocimiento facial, ~6,7 MB: **no borrar ni ignorar**; se sirven como archivos estáticos) |
| Reconocimiento facial | `src/lib/marcacion/face.ts` (servidor), `face-client.ts` y `src/components/marcacion/face-capture.tsx` (teléfono), `src/app/api/marcacion/rostro` |
| Funcionarios (admin) | `src/app/admin/funcionarios`, `src/app/api/funcionarios/*`, `src/lib/funcionarios-store.ts`, `src/lib/funcionarios-schema.ts` |
| Base de datos | `prisma/schema.prisma` + migraciones `16_add_marcacion`, `17_marcacion_parametros`, `18_add_funcionario`, `19_rostro_plantilla`, `20_rrhh`, `21_ia_uso`, `22_ti`, `23_depositos` |

Archivos existentes que se modificaron (revisar si unificás con otros cambios): `src/middleware.ts` (protege `/marcacion/*`),
`src/lib/roles.ts` (restringe `/admin/funcionarios` y `/api/funcionarios`), `src/app/admin/layout.tsx` (ítem "Funcionarios" en el menú),
`src/components/layout/public-shell.tsx` y `page-tracker.tsx` (la PWA no lleva navbar/footer ni cuenta visitas),
`src/lib/audit.ts` y `src/app/admin/sistema/logs/page.tsx` (entidad `Funcionario` en el log de cambios),
`.env.example`, `package.json`, `package-lock.json`.

## 3. Base de datos
Las migraciones nuevas son solo las 6 últimas y se aplican con el mismo comando de siempre (`npm run db:deploy` o `vercel-build`):

| Migración | Qué hace |
|---|---|
| `16_add_marcacion` | Tablas `Sitio`, `Jornada`, `Marca`, `VerificacionEpp`; crea la oficina "Oficina Lambaré" si no hay ninguna |
| `17_marcacion_parametros` | Columna `Jornada.enAlmuerzo`; tablas `MarcacionConfig`, `HorarioUsuario`, `Feriado`, `Ausencia`; feriados de Paraguay 2026-2027 |
| `18_add_funcionario` | Tabla `Funcionario` |
| `19_rostro_plantilla` | Tabla `RostroPlantilla` (solo huellas numéricas, sin imágenes) |
| `21_ia_uso` | Tablas `UsoIA` (registro de llamadas de IA, solo metadatos) e `IaConfig` (límites, interruptores, tarifas) |
| `22_ti` | Tablas `Ticket`, `TicketComentario`, `TicketEvento`, `DbSnapshot` y `TiConfig` (módulo TI) |
| `20_rrhh` | Legajo del funcionario (columnas nuevas en `Funcionario`) y tablas de RRHH: cargos, salarios, documentos, EPP, capacitaciones, parámetros, planillas, recibos y conceptos |

Verificado (migraciones 16 a 18; la 19 es una tabla nueva igual de simple): sobre una base con el esquema de `main` se aplican sin errores y sin diferencias con `schema.prisma`.
Son solo `CREATE TABLE IF NOT EXISTS` y una columna nueva con valor por defecto: no tocan datos existentes ni borran nada.

Nota: las migraciones `0_init` … `15_*` del repositorio no se pueden aplicar sobre una base vacía (ya era así antes). El servidor
real las tiene aplicadas, así que no afecta. Para una base nueva hay que partir de `prisma db push`.

**Si ya existe una tabla de funcionarios hecha por otra persona:** no correr `18_add_funcionario` tal cual. Decidir cuál modelo queda y
adaptar solo `src/lib/marcacion/funcionarios.ts` (lee la fecha de ingreso por `userId`) y `src/lib/funcionarios-store.ts`.

## 4. Variables de entorno
| Variable | Para qué | Obligatoria |
|---|---|---|
| `SESSION_SECRET`, `DATABASE_URL`, `DIRECT_URL` | Ya existentes | Sí |
| `BLOB_READ_WRITE_TOKEN` | Guardar selfies y fotos de equipo en Vercel Blob (URL pública). Sin ella se guardan dentro de la base de datos | Recomendada |
| `MARCACION_GEOFENCE` | `strict` (por defecto) rechaza marcas fuera del radio; `warn` las guarda como "fuera de rango" | No |

Cámara y GPS solo funcionan con HTTPS. El reconocimiento facial no usa servicios externos.

## 5. Después de publicar (en este orden)
1. **Sitios** (`/marcacion/sitios`, como administrador): corregir las coordenadas de la oficina (las precargadas son aproximadas) y su radio; cargar los lugares de trabajo.
2. **Parámetros** (`/marcacion/parametros`): revisar horario por día (lun-vie 08-17, sáb 08-13 por defecto), tolerancia, almuerzo, vacaciones y qué roles marcan asistencia (por defecto solo `tecnico`). Revisar el sábado: está como laboral.
3. **Funcionarios** (`/admin/funcionarios`): cargar el personal con su fecha de ingreso y enlazar cada uno a su usuario. Luego **enrolar el rostro** de cada uno (con su consentimiento, cámara de frente y buena luz).
   Hasta que alguien esté enrolado, su marca de ingreso/salida queda señalada como "sin rostro enrolado". Cuando todos estén enrolados, activar "Exigir rostro enrolado" en Parámetros.
4. **Prueba con un teléfono real:** abrir `https://<dominio>/marcacion`, iniciar sesión, marcar ingreso (pide cámara y ubicación) y probar el flujo completo con un encargado.
5. **Instalar la app:** desde el navegador del teléfono, "Agregar a pantalla de inicio". Solo `/marcacion` es instalable.

## 6. Permisos
| Pantalla | Quién |
|---|---|
| `/marcacion` (jornada) y `/marcacion/ausencias` | Cualquier usuario con sesión |
| `/marcacion/aprobaciones` | Roles con `canAprobarPresupuestos` (admin, gerencia, administración, planner) |
| `/marcacion/reportes` | Roles con `canViewReports` |
| `/marcacion/parametros`, `/marcacion/sitios` | Roles con `canManageConfig` (admin, administración) |
| `/admin/funcionarios` | Roles con `canManageUsers` (admin, administración) |

## 7. Limitaciones conocidas
- Reconocimiento facial por huella numérica, sin imágenes guardadas. Hay que calibrar la exigencia con uso real; la prueba de vida frena fotos pero no un video; una marca dudosa no se puede revisar visualmente (ver `docs/MARCACION.md`).
- La primera vez, el teléfono descarga ~6,7 MB de modelos (después quedan en caché).
- Sin modo offline y sin notificaciones push al encargado.
- Una jornada por persona y día; una sola oficina activa.
- Vacaciones por tramos fijos 12/18/30 días; sin proporcional del primer año ni arrastre de saldo.
- No se ejecutó el escaneo de seguridad (HawkScan) por no haber clave en la sesión.

## 8. Volver atrás
El código nuevo no cambia el comportamiento del resto del sitio. Para desactivar marcación basta no desplegar la rama. Las tablas
nuevas pueden quedar vacías sin efecto; no hay que borrarlas.

Detalle funcional y reglas de cálculo: `docs/MARCACION.md`.

## 8b. Módulo RRHH (migración `20_rrhh`)
Detalle en [`RRHH.md`](RRHH.md). Para desplegarlo:
- **Permiso nuevo `canManageRRHH`** (administrador y administración). Los roles personalizados no lo tienen: otorgarlo desde *Usuarios → Roles* a quien deba ver sueldos. `/admin/funcionarios` pasó a exigir este permiso (antes `canManageUsers`).
- **`BLOB_READ_WRITE_TOKEN` recomendado**: sin él, los documentos del legajo se guardan dentro de la base (máx. 1,5 MB).
- **Antes de liquidar sueldos reales**, contabilidad o un asesor laboral debe validar las reglas de *RRHH → Parámetros* (IPS, recargos, jornal, ausencias, aguinaldo). Los valores iniciales son de referencia.
- Orden de puesta en marcha: Parámetros RRHH → Funcionarios (con usuario enlazado) → salario de cada uno → verificar quién marca asistencia → crear la primera planilla en borrador y compararla con la liquidación vigente antes de usarla.
- Pruebas del motor de cálculo: `npm run test:rrhh`.

## 8c. Módulo de uso de IA (migración `21_ia_uso`)
Detalle en [`IA.md`](IA.md). Para desplegarlo:
- Los 5 puntos de IA existentes ahora **se miden y pueden bloquearse**; por defecto todo queda **activo y sin límites**, así que el comportamiento no cambia hasta que se configure algo en *Sistema → Uso de IA*.
- Las claves (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) siguen en variables de entorno; el panel solo muestra si están configuradas.
- Para ver el **costo estimado**, cargar las tarifas vigentes de cada modelo en el panel (sin tarifa no se calcula).
- No hay permiso nuevo: usa `canManageConfig` (administrador y administración).
- Los registros de uso de IA **se depuran solos** (180 días por defecto, una vez por día, sin cron): no hace falta configurar nada.
- Pruebas: `npm run test:ia` (borra registros de IA: solo contra una base local).

## 8d. Módulo TI (migración `22_ti`)
Detalle en [`TI.md`](TI.md). Menú nuevo **TI** (panel, tickets, base de datos, uso de IA, configuración).
- **Permiso nuevo `canUseTickets`** (admin, gerencia, administración, planner): crear tickets y ver los propios. Los roles personalizados no lo tienen: otorgarlo en *Usuarios → Roles*. TI (gestión de todos los tickets, base de datos) usa `canManageConfig`.
- `/api/notifications` dejó de estar restringida por middleware (la campana ahora también avisa de tickets); cada sección se filtra por permiso dentro de la ruta.
- Base de datos en **solo monitoreo**. Ajustar el límite del plan (512 MB por defecto) en *TI → Base de datos → Umbrales*.

## 8e. Depósitos e inventario (migración `23_depositos`)
Detalle en [`DEPOSITOS.md`](DEPOSITOS.md). Tablas `Deposito` e `ItemInventario`; sin permisos nuevos (`canManageInventory`). Las fotos usan `BLOB_READ_WRITE_TOKEN` (carpeta `inventario/`).

## 9. Material para usuarios
`docs/guias/` trae las guías de **modo de uso** (trabajador, encargado, administración, RRHH y una tarjeta rápida de una hoja), en Markdown y en PDF listo para imprimir (`docs/guias/pdf/`). Las capturas usan datos de ejemplo. Entregar el PDF del trabajador y la tarjeta rápida a quienes marquen, y el del encargado a quienes aprueban.
