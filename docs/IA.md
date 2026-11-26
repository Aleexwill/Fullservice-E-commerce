# Módulo de uso de IA

Registra, mide y controla las funciones del sistema que usan inteligencia artificial. Panel: **Sistema → Uso de IA** (`/admin/ia`), con un resumen en **Configuración**.
Permiso: `canManageConfig` (administrador y administración). Guía de uso: [`guias/03-guia-administrador.md`](guias/03-guia-administrador.md), sección *Uso de IA*.

## Qué hace
- **Mide cada llamada**: función, proveedor, modelo, usuario, tokens de entrada y salida, tiempo y resultado (`OK`, `ERROR`, `BLOQUEADA`).
- **Panel**: llamadas, tokens y costo estimado del mes, por función, por usuario, por modelo, por día, y las últimas llamadas con filtros. Estado de las claves (solo *configurada* o *sin clave*, nunca el valor) y botón *Probar conexión*.
- **Controla**: interruptor global, interruptor por función, límite mensual de llamadas y de gasto (global), límite mensual por función y límite diario por usuario. Todo editable sin tocar código.
- **Auditoría**: los cambios de configuración quedan en el Log de cambios (entidad *Config. IA*).

## Privacidad
**No se guarda el texto de lo que se envía ni de lo que responde la IA** (puede contener datos de clientes, presupuestos o imágenes): solo metadatos de uso. Los mensajes de error del proveedor se limpian antes de guardarse (se eliminan claves tipo `key=…`, `AIza…`, `sk-…`).

## Puntos instrumentados
| Clave | Qué hace | Ruta | Proveedor (modelo) | Si está bloqueada |
|---|---|---|---|---|
| `corregir-texto` | Corrige textos de presupuestos | `/api/ai/corregir` | Gemini | Responde 503/429 con el motivo |
| `mejorar-titulo` | Título y alcance de secciones | `/api/ai/mejorar-titulo` | Gemini (`GEMINI_MODEL`) | Responde con la **plantilla sin IA** y `iaBloqueada` |
| `mejorar-descripcion` | Descripciones de productos | `/api/ai/mejorar-descripcion` | Anthropic (`claude-haiku-4-5`), OpenAI (`gpt-4o-mini`) de respaldo | Plantilla sin IA y `iaBloqueada` |
| `presupuesto-analizar` | Borrador de presupuesto desde texto o imagen | `/api/presupuestos/analizar` | Gemini | 503/429 con el motivo |
| `presupuesto-ajustar` | Ajustes de presupuesto por chat | `/api/presupuestos/[id]/ajustar` | Gemini | 503/429 con el motivo |

Para sumar una función nueva: agregarla a `FUNCIONES_IA` (`src/lib/ia/config.ts`), llamar `autorizarIA(clave, sesion)` antes del proveedor y envolver la llamada con `medirIA(...)` (o `generarConGemini(...)` para el SDK de Gemini).

## Cómo funcionan los límites
- Se cuentan **solo las llamadas correctas** (`OK`): las que fallan o se bloquean no consumen el límite.
- El mes y el día se cuentan por **calendario de Paraguay** (UTC-3), no por UTC.
- El **límite de gasto** se calcula con las **tarifas** cargadas en el panel (US$ por millón de tokens, por modelo). **Un modelo sin tarifa no suma al gasto** y el costo mostrado es "parcial". Es una estimación, **no la factura**: las tarifas hay que tomarlas de lo que publica cada proveedor.
- Si falla la medición (por ejemplo, la base de datos no responde), **la IA no se bloquea**: se permite la llamada y se deja el error en el log del servidor.
- Un límite no es un tope duro bajo concurrencia: si varias llamadas entran a la vez justo en el límite, puede pasarse por unas pocas.

## Datos (migración `21_ia_uso`)
`UsoIA` (una fila por llamada, índices por fecha, función, usuario y estado) e `IaConfig` (fila `default` con interruptores, límites, tarifas y días de retención).

## Retención
Los registros no se borran solos. El panel indica los días de retención (180 por defecto) y se depuran con `DELETE /api/ia/registros?antesDeDias=N` (mínimo 7). Conviene hacerlo de vez en cuando; cada llamada ocupa pocos bytes.

## Probar conexión
`POST /api/ia/probar` hace una llamada mínima ("Respondé solo: ok") al proveedor. **Cuenta como consumo** (función `prueba`), está limitada a 6 por minuto y no pasa por los límites, para poder diagnosticar aunque la IA esté apagada.

## Pruebas
`npm run test:ia` ejecuta 22 casos (medición, no guardar claves, interruptores, límites de llamadas, gasto, por función y por usuario) contra la base de datos. **Borra los registros de uso y la configuración de IA**, por eso se niega a correr si `DATABASE_URL` no es una base local.

## Limitaciones
- Las llamadas de **front-end directo** a proveedores (si las hubiera fuera de estos 5 puntos) no se miden. Hoy no hay otras en el código; los asistentes públicos (`public/fsc-assistant.js`, `fsc-login-bot.js`) no usan estas APIs.
- Los tokens salen de lo que informa cada proveedor; si uno no los informa, se registran en 0.
- El panel no muestra el texto de las consultas por diseño.
