# Módulo RRHH

Legajos, vencimientos y planilla de sueldos dentro del admin. Guía de uso para usuarios: [`guias/05-guia-rrhh.md`](guias/05-guia-rrhh.md).

## Pantallas y permiso
Todo requiere el permiso **`canManageRRHH`** (administrador y administración; asignable a roles personalizados desde *Usuarios → Roles*).
Los sueldos son datos sensibles. Lo cubren el middleware (`/admin/rrhh`, `/admin/funcionarios`, `/api/rrhh`, `/api/funcionarios`) y cada API con `requireRole('canManageRRHH')`.

| Ruta | Qué hace |
|---|---|
| `/admin/rrhh` | Panel: avisos, indicadores, vencimientos, cumpleaños, cambios de tramo de vacaciones, planillas |
| `/admin/funcionarios` y `/admin/funcionarios/[id]` | Lista y legajo (datos, cargos y salario, documentos, EPP, capacitaciones) |
| `/admin/rrhh/vencimientos` | Documentos, EPP y capacitaciones vencidos o por vencer |
| `/admin/rrhh/planilla` y `/[id]` | Planillas mensuales y de aguinaldo; recibos, conceptos manuales, cierre |
| `/admin/rrhh/parametros` | Reglas de la planilla, días de alerta y catálogo de EPP |

## Datos (migración `20_rrhh`)
`Funcionario` (campos de legajo nuevos), `CargoHistorial`, `SalarioFuncionario` (historial: vale el último con `vigenteDesde` ≤ fin del período), `DocumentoFuncionario`,
`EntregaEpp`, `Capacitacion`, `RrhhConfig` (fila `default`), `Planilla` (única por `periodo + tipo`), `Recibo`, `ConceptoPlanilla`.
Montos en guaraníes como enteros. Fechas como `YYYY-MM-DD` (zona America/Asuncion).

## Planilla: cómo se calcula (`src/lib/rrhh/planilla.ts`, funciones puras)
La asistencia sale de `generarReporte` de marcación; el salario, del historial salarial; los conceptos manuales, de `ConceptoPlanilla`.

| Concepto | Regla (valores por defecto en `src/lib/rrhh/config.ts`) |
|---|---|
| Jornal | mensual ÷ `divisorJornal` (30) |
| Valor hora | jornal ÷ `horasJornada` (8) |
| Sueldo mensual | mes completo = sueldo entero (28, 30 o 31 días); parcial (ingreso o baja en el mes) = proporcional a los días de vínculo, tope 30 |
| Jornalero | jornal × (días trabajados + feriados laborables no trabajados + ausencias pagadas) |
| Extra diurna | horas × valor hora × (1 + 50 %) |
| Extra nocturna | las posteriores a `nocturnoDesde` (20:00): × (1 + 100 %) |
| Domingo o feriado trabajado | todas las horas × (1 + 100 %), además del sueldo |
| Ausencia sin aviso | − 1 jornal por día laboral sin feriado (si `descontarAusencias`) |
| Ausencia aprobada | pagada o no según tipo (`ausenciaPagada`; por defecto vacaciones y licencia sí; permiso y reposo no) |
| Tardanza y salida anticipada | − minutos × valor hora ÷ 60 (solo si `descontarTardanza`; por defecto no) |
| Aporte IPS trabajador | 9 % de la base imponible = sueldo + extras + haberes imponibles − descuentos por ausencia y tardanza |
| Aporte patronal | 16,5 % de la misma base; solo informativo (costo para la empresa) |
| Aguinaldo | 1/12 de los **haberes** de las planillas mensuales **cerradas** del año; IPS solo si `ipsSobreAguinaldo` |

Cada línea se redondea al guaraní. `neto = haberes − descuentos`.

### ⚠ Las reglas son de referencia y deben validarse
Los porcentajes y criterios son una **base razonable, no una verificación legal**. Antes de liquidar sueldos reales, contabilidad o un asesor laboral debe confirmar:
aporte a IPS (trabajador y empleador), recargos de horas extra diurnas, nocturnas y de domingo y feriado, el divisor del jornal, el tratamiento de domingos y feriados trabajados para mensualeros (se paga el recargo sobre las horas,
además del sueldo), qué ausencias justificadas se pagan, si se descuentan tardanzas, y la base y el tratamiento del aguinaldo.
La planilla guarda las reglas usadas al calcular (`Planilla.reglas`).

### No incluido (cargar como concepto manual si corresponde)
Bonificación familiar, préstamos en cuotas, embargos, subsidios de IPS por reposo, retenciones, **liquidación final** (vacaciones no gozadas, preaviso, indemnización), pago por quincena y descuentos de ley adicionales.

### Salvaguardas
- **Cierre:** recalcula por última vez y congela; luego no se recalcula, no se tocan sus conceptos ni se borra. **Reabrir** vuelve a borrador (queda auditado); no se puede si hay un aguinaldo cerrado del mismo año.
- Con **5 o más ausencias sin aviso** en un recibo, el cierre exige confirmación expresa (suele indicar que no se marcó asistencia).
- No se cierra con neto negativo. No se borra un salario si el funcionario tiene planillas cerradas.
- Los recibos de planillas en borrador llevan marca de agua.
- El **Log de cambios** registra altas, cierres y reaperturas de planilla, cambios de salario y de datos sensibles del funcionario.
- Sin asistencia calculable (sin usuario enlazado o que no marca), el sistema **no descuenta nada** y lo advierte.

## Vencimientos y EPP
- Catálogo de EPP en `RrhhConfig` con vida útil en meses; la reposición = entrega + vida útil.
- De cada ítem cuenta la entrega **más reciente** por funcionario; solo se avisa por funcionarios activos.
- `alertaDias` (30 por defecto) define cuándo un vencimiento pasa a "por vencer".

## Documentos
`/api/rrhh/upload`: PDF, JPG, PNG o WEBP de hasta 4 MB, tipo verificado por el contenido (no por la extensión). Con `BLOB_READ_WRITE_TOKEN` van a Vercel Blob (URL pública);
sin token (desarrollo) se guardan como data URL en la base y el límite baja a 1,5 MB. **En producción conviene configurar el token**: los documentos del legajo no deberían depender de la base.

## Pruebas
`npm run test:rrhh` ejecuta 33 casos del motor (cálculos verificados a mano: mes completo, ausencias, extras diurnas y nocturnas, feriado y domingo, ingreso y baja a mitad de mes, jornalero, conceptos manuales, aguinaldo)
y 21 del neto en letras. Si se cambian reglas o el motor, hay que revisar esos resultados a conciencia.

## Pendientes conocidos
- Un funcionario con usuario enlazado que **no marca** asistencia aparece sin ajustes: hay que excluirlo en Marcación → Parámetros → Personas (el sistema lo avisa).
- Sin recibos por quincena, sin liquidación final automática, sin pago de vacaciones por separado, sin préstamos en cuotas.
- La unificación con otra versión del modelo de funcionarios debe contemplar los campos de legajo y las relaciones nuevas (`Funcionario` ← `CargoHistorial`, `SalarioFuncionario`, `DocumentoFuncionario`, `EntregaEpp`, `Capacitacion`).
