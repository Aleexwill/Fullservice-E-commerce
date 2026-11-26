# Módulo TI

Reúne lo técnico del sistema en un solo menú (**TI**): panel con alertas, tickets de incidencias y mejoras, monitoreo de la base de datos, uso de IA (ver [`IA.md`](IA.md)) y configuración del sistema.

## Permisos
| Qué | Permiso | Roles por defecto |
|---|---|---|
| Panel TI, base de datos, uso de IA, configuración, **gestionar todos los tickets** | `canManageConfig` | admin, administración |
| **Crear tickets y ver los propios** | `canUseTickets` (nuevo) | admin, administración, gerencia, planner |

Los roles personalizados no traen `canUseTickets`: otorgarlo en *Usuarios → Roles* ("Tickets de TI").
Rutas: `/admin/ti/tickets` y `/api/ti/tickets` exigen `canUseTickets`; el resto de `/admin/ti` y `/api/ti` exige `canManageConfig`.

## Tickets (`/admin/ti/tickets`)
- Tipos: **Error**, **Corrección**, **Mejora**. Prioridad: baja, media, alta, crítica. Módulo, pantalla (se completa sola desde el botón flotante **¿Algo no funciona?**), pasos, resultado esperado y hasta **3 adjuntos** (JPG/PNG/WEBP/PDF, 4 MB; el tipo se verifica por el contenido).
- Estados: Nuevo → En análisis → Esperando información → En curso → En prueba → Resuelto → Cerrado / Rechazado.
- **Solicitante:** ve solo sus tickets, comenta, **confirma** (Resuelto → Cerrado), **reabre**, o cancela mientras esté Nuevo. Si responde a un ticket "Esperando información", vuelve a "En análisis".
- **TI:** ve todos, cambia estado y prioridad, asigna, escribe la resolución y notas internas (el solicitante no las ve ni sabe que existen).
- Cada cambio queda en el **historial** del ticket. Límite: 15 tickets por hora y por usuario.
- **Avisos:** en la campana del admin (sin correos). TI recibe tickets nuevos (rojo si es crítico), reaperturas y respuestas; el solicitante recibe cambios de estado y comentarios de TI. Se calculan de los últimos 14 días.
  `/api/notifications` ya no está restringida por el middleware: cada sección se entrega según permiso (comercial con `canManageLeads`, tickets con `canUseTickets`).

## Base de datos (`/admin/ti/base-de-datos`) — solo lectura
Tamaño total vs. límite del plan, tablas (filas, datos, índices, filas muertas, última limpieza), conexiones, acierto de caché, índices sin uso, estado de migraciones y **crecimiento diario** con proyección de días hasta el límite.
- Un punto de tamaño por día (`DbSnapshot`), guardado al abrir la pantalla o el panel (atómico, sin duplicados). El gráfico aparece desde el segundo día.
- **Alertas:** uso ≥ aviso/crítico (80 % / 90 % del límite, configurables), migración fallida, conexiones en transacción inactiva, muchas conexiones, consulta lenta, tablas con muchas filas muertas.
- Umbrales editables (límite del plan en MB — Neon gratuito: 512 —, % de aviso y crítico, máx. de conexiones). Es lo único que se escribe; no hay consola SQL ni exportación.

## Base de datos y despliegue
Migración `22_ti`: tablas `Ticket`, `TicketComentario`, `TicketEvento`, `DbSnapshot`, `TiConfig`. Solo crea tablas.
Si se usa Vercel Blob (`BLOB_READ_WRITE_TOKEN`), los adjuntos van a `tickets/`; sin él se guardan en la base (máx. 1,5 MB).

## Pruebas
Verificadas contra una base local por API: permisos por rol, validación, flujo completo (crear, nota interna, asignar, resolver, reabrir, confirmar), aislamiento entre solicitantes, campana, snapshot único por día y umbrales. No se corrió HawkScan (sin clave en la sesión).
