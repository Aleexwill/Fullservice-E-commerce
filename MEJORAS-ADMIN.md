# Mejoras Pendientes — Panel Admin
> Auditoría realizada: Septiembre 2026

---

## 🔴 Críticos

| # | Problema | Módulo | Notas |
|---|----------|--------|-------|
| 1 | Sin paginación en listado de productos | Productos | **Resuelto** — paginación de 20 items + filtros de estado/categoría |
| 2 | `scheduledDate` en presupuestos es texto libre | Presupuestos | Reemplazar por date picker; almacenar como `DateTime` en BD |
| 3 | Toggles de notificaciones (email/WhatsApp) no tienen implementación real | Config | Necesita integración con servicio SMTP o Twilio/WhatsApp API |
| 4 | `_forceCode` hack en API de presupuestos PUT | Presupuestos | Mover regeneración de código a lógica explícita en la API |

---

## 🟠 Importantes

| # | Problema | Módulo |
|---|----------|--------|
| 5 | Panel de cliente es solo lectura — no se puede editar desde el detalle | Clientes |
| 6 | Sin generación de PDF para presupuestos | Presupuestos |
| 7 | Sin botón "Convertir lead → presupuesto" | Leads / CRM |
| 8 | Íconos de servicios se guardan como string (`"Wrench"`) sin preview real | Servicios CMS |
| 9 | Dos sistemas de banners duplicados sin integración (`/contenido` + `/promos`) | Contenido |
| 10 | Sin selector de rango de fechas en reportes y analytics | Reportes / Analytics |
| 11 | `filterActive` del lado cliente en API de productos carga todos antes de filtrar | Productos |

---

## 🟡 Menores

| # | Problema | Módulo |
|---|----------|--------|
| 12 | Categorías hardcodeadas en múltiples componentes sin fuente única de verdad | Global |
| 13 | Slug de producto no se auto-genera desde el nombre — campo manual | Productos |
| 14 | Sin drag-and-drop para reordenamiento (carrusel, promos, portfolio, servicios) | Varios |
| 15 | Upload siempre guarda en path `productos/` aunque se use en otras secciones | Upload |
| 16 | Rate limiting de AI es in-memory — se resetea con cada instancia serverless | AI |
| 17 | Botón editar en carrusel muestra ícono `Upload` en lugar de `Pencil` | Carrusel |
| 18 | Campos `totalSpent`, `size`, `position` existen en TypeScript pero no se muestran en UI | Global |
| 19 | Sin validación de formato de URL en campos de redes sociales | Config |
| 20 | Sin deduplicación de clientes/leads por email o teléfono al crear | Clientes / Leads |
| 21 | Sin historial de cambios de estado en pedidos | Pedidos |
| 22 | JWT expira en 12h sin refresh token — sesión se corta en trabajo largo | Auth |
| 23 | Sin bloqueo por intentos fallidos de login | Auth |
| 24 | `CATEGORIES` de producto hardcodeado, no se comparte con inventario ni servicios | Productos |
| 25 | Sin preview del proyecto desde el panel de portfolio admin | Portfolio |
| 26 | Solo 12 íconos disponibles para servicios CMS — catálogo muy limitado | Servicios CMS |

---

## 💡 Funcionalidades nuevas deseables

| # | Funcionalidad |
|---|---------------|
| F1 | Múltiples usuarios con roles (admin / vendedor / técnico) |
| F2 | Flujo de aprobación interna antes de enviar presupuesto al cliente |
| F3 | Firma digital o confirmación formal del cliente en presupuesto |
| F4 | Diff entre versiones de presupuesto |
| F5 | Importación / exportación masiva de productos (CSV/Excel) |
| F6 | Historial de precios en inventario de materiales |
| F7 | Control de stock real en materiales (no solo referencia de precios) |
| F8 | Proyecciones y tendencias en reportes |
| F9 | Exportación de reportes a CSV/Excel/PDF |
| F10 | Desglose entre facturado y cobrado en dashboard |
| F11 | Editor de texto enriquecido (rich text) para misión/visión/descripciones |

---

## APIs registradas

| Endpoint | Métodos |
|----------|---------|
| `/api/auth/login` | POST |
| `/api/auth/logout` | POST |
| `/api/productos` | GET (con paginación), POST |
| `/api/productos/[id]` | GET, PUT, DELETE |
| `/api/productos/stats` | GET |
| `/api/pedidos` | GET, POST |
| `/api/pedidos/[id]` | PUT, DELETE |
| `/api/pedidos/stats` | GET |
| `/api/presupuestos` | GET, POST |
| `/api/presupuestos/[id]` | PUT, DELETE |
| `/api/presupuestos/stats` | GET |
| `/api/clientes` | GET, POST |
| `/api/clientes/[id]` | PUT, DELETE |
| `/api/leads` | GET, POST |
| `/api/leads/[id]` | PUT, DELETE |
| `/api/leads/stats` | GET |
| `/api/materiales` | GET, POST |
| `/api/materiales/[id]` | PUT, DELETE |
| `/api/servicios-cms` | GET, POST |
| `/api/servicios-cms/[id]` | PUT, DELETE |
| `/api/portfolio` | GET, POST |
| `/api/portfolio/[id]` | PUT, DELETE |
| `/api/carousel` | GET, POST |
| `/api/carousel/[id]` | PUT, DELETE |
| `/api/carousel-slides` | GET (público) |
| `/api/promo-banners` | GET (público) |
| `/api/promos` | GET, POST |
| `/api/promos/[id]` | PUT, DELETE |
| `/api/contenido` | GET (público), PUT |
| `/api/config` | GET (público), PUT |
| `/api/analytics` | GET, POST |
| `/api/upload` | POST |
| `/api/notifications` | GET |
| `/api/ai/mejorar-descripcion` | POST |
| `/api/ai/mejorar-titulo` | POST |
