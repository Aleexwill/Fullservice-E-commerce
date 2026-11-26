# Llevar marcación y funcionarios al servidor

Todo el trabajo está en la rama `claude/optimistic-euler-5wkeqd` (sin PR abierto). No se compiló nada para entregarlo:
los archivos generados (`.next`, `node_modules`) están ignorados por git y no forman parte de la rama.

## 1. Traer el código
```bash
git fetch origin
git checkout claude/optimistic-euler-5wkeqd
npm install
```
`npm install` instala una dependencia nueva: `pdf-lib` (PDF mensual). No hay otras.

## 2. Qué se agrega (65 archivos)
| Área | Dónde |
|---|---|
| PWA de marcación (páginas) | `src/app/marcacion/*` (jornada, ausencias, aprobaciones, reportes, parámetros, sitios, login) |
| APIs de marcación | `src/app/api/marcacion/*` |
| Lógica de marcación | `src/lib/marcacion/*` (reglas de cálculo, servidor, PDF, enlace a funcionarios) |
| Componentes y estilos | `src/components/marcacion/*`, `src/styles/marcacion.css` |
| Archivos de la PWA | `public/marcacion/` (manifest, service worker, íconos) |
| Funcionarios (admin) | `src/app/admin/funcionarios`, `src/app/api/funcionarios/*`, `src/lib/funcionarios-store.ts`, `src/lib/funcionarios-schema.ts` |
| Base de datos | `prisma/schema.prisma` + migraciones `16_add_marcacion`, `17_marcacion_parametros`, `18_add_funcionario` |

Archivos existentes que se modificaron (revisar si unificás con otros cambios): `src/middleware.ts` (protege `/marcacion/*`),
`src/lib/roles.ts` (restringe `/admin/funcionarios` y `/api/funcionarios`), `src/app/admin/layout.tsx` (ítem "Funcionarios" en el menú),
`src/components/layout/public-shell.tsx` y `page-tracker.tsx` (la PWA no lleva navbar/footer ni cuenta visitas),
`src/lib/audit.ts` y `src/app/admin/sistema/logs/page.tsx` (entidad `Funcionario` en el log de cambios),
`.env.example`, `package.json`, `package-lock.json`.

## 3. Base de datos
Las migraciones nuevas son solo las 3 últimas y se aplican con el mismo comando de siempre (`npm run db:deploy` o `vercel-build`):

| Migración | Qué hace |
|---|---|
| `16_add_marcacion` | Tablas `Sitio`, `Jornada`, `Marca`, `VerificacionEpp`; crea la oficina "Oficina Lambaré" si no hay ninguna |
| `17_marcacion_parametros` | Columna `Jornada.enAlmuerzo`; tablas `MarcacionConfig`, `HorarioUsuario`, `Feriado`, `Ausencia`; feriados de Paraguay 2026-2027 |
| `18_add_funcionario` | Tabla `Funcionario` |

Verificado: sobre una base con el esquema de `main` se aplican las 3 sin errores y sin diferencias con `schema.prisma`.
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

Cámara y GPS solo funcionan con HTTPS.

## 5. Después de publicar (en este orden)
1. **Sitios** (`/marcacion/sitios`, como administrador): corregir las coordenadas de la oficina (las precargadas son aproximadas) y su radio; cargar los lugares de trabajo.
2. **Parámetros** (`/marcacion/parametros`): revisar horario por día (lun-vie 08-17, sáb 08-13 por defecto), tolerancia, almuerzo, vacaciones y qué roles marcan asistencia (por defecto solo `tecnico`). Revisar el sábado: está como laboral.
3. **Funcionarios** (`/admin/funcionarios`): cargar el personal con su fecha de ingreso y enlazar cada uno a su usuario.
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
- La selfie se guarda como evidencia; **no verifica identidad** (ver `src/lib/marcacion/face.ts`).
- Sin modo offline y sin notificaciones push al encargado.
- Una jornada por persona y día; una sola oficina activa.
- Vacaciones por tramos fijos 12/18/30 días; sin proporcional del primer año ni arrastre de saldo.
- No se ejecutó el escaneo de seguridad (HawkScan) por no haber clave en la sesión.

## 8. Volver atrás
El código nuevo no cambia el comportamiento del resto del sitio. Para desactivar marcación basta no desplegar la rama. Las tablas
nuevas pueden quedar vacías sin efecto; no hay que borrarlas.

Detalle funcional y reglas de cálculo: `docs/MARCACION.md`.
