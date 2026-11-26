# Consentimiento de rostro · Notas para quien lo implementa

Este documento **no se imprime ni se entrega al funcionario**. Acompaña al formato `04-consentimiento-rostro` (disponible en Word, para editar, y en PDF, para imprimir).

> **Es un modelo, no asesoramiento legal.** Antes de usarlo, que lo revise un abogado o asesor de la empresa.

## 1. Qué completar antes de usarlo

Campos entre corchetes en el formato:

| Campo | Qué poner |
|---|---|
| Razón social y RUC | Datos legales de la empresa |
| Plazo de los registros de asistencia | Cuánto tiempo se guardan las marcas y horas, según la normativa laboral aplicable |
| Medio de contacto para ejercer derechos | Persona, correo o teléfono de administración |
| Procedimiento alternativo | Cómo marca su asistencia quien no da el consentimiento (ver el punto 3) |

## 2. Qué debe revisar quien asesora legalmente

- La **normativa de protección de datos personales y datos biométricos** aplicable en Paraguay, y si exige registros, inscripciones o requisitos adicionales para este tipo de dato.
- Si el **consentimiento del trabajador** es suficiente base en una relación de dependencia, donde puede no considerarse plenamente libre. Por eso el formato incluye una **alternativa** sin consecuencias.
- Si la **base de datos está alojada fuera del país** (el sistema usa servicios de infraestructura en la nube), si esto se considera una transferencia internacional de datos y qué hay que informar.
- El **plazo de conservación** de los registros de asistencia.
- Si hace falta **informar o consultar a representantes** de los trabajadores o a la autoridad laboral.
- La **redacción final** de los derechos y del retiro del consentimiento.

## 3. Procedimiento alternativo: hoy no está completo en el sistema

El formato promete que quien no consienta puede registrar su asistencia de otra forma. Esto es lo que el sistema permite hoy:

| Situación | Qué pasa |
|---|---|
| *Exigir rostro enrolado* **apagado** (valor por defecto) | Quien no está enrolado **puede marcar**, pero sus marcas de ingreso y salida quedan señaladas como **"Sin rostro enrolado"** en reportes y PDF. Sirve como alternativa. |
| *Exigir rostro enrolado* **encendido** | Quien no está enrolado **no puede marcar** ingreso ni salida. **No hay alternativa**: el consentimiento dejaría de ser voluntario. |

**Recomendación:** no activar *Exigir rostro enrolado* mientras haya funcionarios que no consienten, o implementar antes una **marca manual del encargado** (hoy no existe). Definir y escribir el procedimiento alternativo en el punto 8 del formato.

## 4. Compromisos que asume la empresa al firmarlo

El formato afirma lo siguiente. Confirmar que la empresa realmente lo va a cumplir:

- Que la huella se usa **solo** para verificar ingreso y salida.
- Que una marca no verificada **no se considera por sí sola una falta** y se revisa con el funcionario.
- Que retirar el consentimiento **no tiene consecuencias desfavorables**.
- Que la huella se **elimina** al dar de baja al funcionario o si lo pide.
- Que solo accede personal autorizado de administración.

## 5. Qué afirma el formato y dónde se cumple en el sistema

Para poder responder ante una consulta:

| Afirmación del formato | Dónde se cumple |
|---|---|
| No se guardan fotos ni videos del rostro | El enrolamiento envía solo números (`/api/marcacion/rostro`); la tabla `RostroPlantilla` guarda vectores; no hay columna de foto de rostro en `Marca`. |
| La huella de cada marca no se guarda | `/api/marcacion/marcas` guarda solo `rostroEstado` y `rostroScore`. |
| Se elimina al dar de baja | `DELETE /api/funcionarios/[id]` y la edición con *Activo* desmarcado borran la plantilla. |
| Se puede eliminar a pedido | Funcionarios → **Borrar** (junto a la fecha de enrolamiento). |
| El enrolamiento queda registrado | Se guarda quién enroló (`enroladoPor`). El enrolamiento, el nuevo enrolamiento y el **borrado** de la huella quedan en el **Log de cambios** del admin (campo *Huella facial*). |
| La ubicación no se sigue de forma continua | El GPS en vivo se usa solo en pantalla durante un traslado y no se guarda; se guarda la ubicación de cada marca. |
| Solo accede personal autorizado | Funcionarios y enrolamiento requieren permiso de gestión de usuarios (administrador y administración). |

A tener en cuenta: los **registros de asistencia** (marcas con hora, ubicación y resultado) **no se borran** al dar de baja a la persona ni al borrar su huella. Por eso el formato aclara un plazo aparte para ellos.

## 6. Cómo usarlo en el día a día

1. **Antes de enrolar**: explicar el documento, responder preguntas y entregar una copia.
2. El funcionario lo **firma** (con la casilla SÍ o NO marcada). Si marca NO, no se lo enrola.
3. Recién con el documento firmado, enrolar: en **Funcionarios → Enrolar rostro**, tildar la casilla de consentimiento de la ventana y tomar las 3 capturas.
4. **Archivar** el original en el legajo y dar la copia al funcionario.
5. Si retira el consentimiento: **Funcionarios → Borrar** (queda en el Log de cambios), y completar el apartado 11 del documento.

## 7. Funcionarios que ya fueron enrolados

Si se enrolaron personas **sin** este documento, firmarlo ahora y, a quien no firme, borrar su huella.
