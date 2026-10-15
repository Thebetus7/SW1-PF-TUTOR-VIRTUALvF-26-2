# SDD-Spec-High: Especificación Funcional Ágil y Formal (Protocolo de 2 Tiempos)

Este workflow guía al asistente de IA en la captura estructurada de requerimientos de negocio para redactar el archivo `docs/specs/XX-nombre/spec.md`, priorizando **primero el cuestionamiento de cabos sueltos mediante preguntas clave con opciones recomendadas**, y luego asistiendo como copiloto técnico.

> **Regla de Oro: Primero Cuestionar, Luego Redactar**:
> La IA no debe asumir reglas de negocio, validaciones límite o excepciones no especificadas. Si el requerimiento tiene cabos sueltos o alternativas de comportamiento, la IA debe formular primero un mínimo de preguntas con opciones sugeridas antes de redactar la especificación.

---

## 1. Protocolo Operativo en 2 Tiempos

Cuando el usuario invoque este workflow (`/sdd-spec-high`):

### TIEMPO 1: Análisis Crítico y Cuestionamiento de Cabos Sueltos (Grill-Me de Requerimientos)
1. **Lectura Contextual de la Constitución**:
   - Lee `docs/constitution.md` (Sección 2: Flujo Global, Sección 4: Topología y Sección 6: Principios).
   - Identifica el número del siguiente módulo (ej. `docs/specs/02-catalogo/`).
2. **Detección de Cabos Sueltos Funcionales**:
   - La IA analiza el requerimiento del usuario y detecta qué reglas críticas no están definidas:
     - *Reglas de validación y límites*: ¿Cuáles son los rangos numéricos, longitudes de texto o formatos requeridos?
     - *Entidades co-dependientes y estado vacío*: ¿Qué ocurre si la entidad de referencia está vacía? ¿Se permite opción neutra ("Sin asignar") o creación al vuelo?
     - *Manejo de errores observables*: ¿Qué mensaje o retroalimentación recibe el usuario ante un fallo?
     - *Permisos y roles*: ¿Quién tiene autorización para ejecutar esta acción?
3. **Formulación de Preguntas Mínimas con Opciones Recomendadas**:
   - La IA formula un bloque conciso de preguntas directas (máximo 2 a 4) enfocadas exclusivamente en los cabos sueltos de negocio detectados.
   - Cada pregunta debe incluir opciones de respuesta breves con una opción `(Recomendada)` fundamentada en buenas prácticas.
   - La IA **se detiene y espera la respuesta del usuario** antes de escribir la spec.

---

### TIEMPO 2: Asistencia Proactiva del Copiloto Técnico
Una vez que el usuario responde y los cabos sueltos quedan aclarados:
1. **Modelado Formal y Trazable**:
   - La IA traduce los acuerdos a Historias de Usuario (`HU-XX`), Requisitos Funcionales con sintaxis EARS (`RF-XX.Y`) y Criterios de Aceptación observables en Gherkin BDD (`SC-XX.Y.Z`).
2. **Redacción del Artefacto**:
   - Genera el archivo `docs/specs/XX-nombre/spec.md` siguiendo la plantilla oficial por secciones.

---

## 2. Sistema de Trazabilidad Derivada

```text
SECCIÓN 2: HU-XX (Historia de Usuario: Perspectiva de Negocio)
              ↓
SECCIÓN 3: RF-XX.Y (Requisitos Funcionales: Sintaxis EARS)
              ↓
SECCIÓN 4: SC-XX.Y.Z (Criterios de Aceptación: Sintaxis Gherkin BDD)
```

---

## 3. Patrones de Sintaxis EARS para Requisitos Funcionales

Cada `RF-XX.Y` debe redactarse bajo uno de los patrones canónicos de EARS:
- **Ubiquitous**: *"El sistema deberá [comportamiento constante]"*.
- **Event-Driven**: *"CUANDO [evento disparador], el sistema deberá [respuesta]"*.
- **State-Driven**: *"MIENTRAS [estado del sistema], el sistema deberá [comportamiento]"*.
- **Optional Feature**: *"DONDE [opción o feature habilitado], el sistema deberá [comportamiento]"*.
- **Unwanted Behavior**: *"SI [condición anómala o catálogo vacío], ENTONCES el sistema deberá [acción de contención y valor por defecto]"*.

---

## 4. Plantilla Oficial de Salida: `docs/specs/XX-nombre/spec.md`

```markdown
# Especificación Funcional: [Nombre del Módulo o Feature]

> Módulo: `docs/specs/XX-nombre/` | Estado: Aprobada | Metodología: SDD-Spec-High

---

## 1. Contexto, Objetivos y Anclaje al Flujo Global
- **Objetivo**: [Qué valor aporta esta funcionalidad]
- **Ubicación en el Flujo Global**: [A qué etapa del flujo macro de docs/constitution.md corresponde]
- **Alcance**: [Qué incluye y qué queda explícitamente fuera]
- **Actores**: [Roles involucrados]

---

## 2. Historias de Usuario (HU)

### HU-01: [Título de la Historia]
**Como** [rol del usuario],  
**Quiero** [acción o capacidad deseada],  
**Para** [beneficio o valor de negocio obtenido].

---

## 3. Requisitos Funcionales (RF con Sintaxis EARS)

### Requisitos de HU-01
- **`RF-01.1` [Event-Driven]**: CUANDO el usuario solicita [acción], el sistema deberá [resultado observable].
- **`RF-01.2` [Unwanted Behavior / Fallback]**: SI el catálogo de referencia no posee elementos registrados, ENTONCES el sistema deberá proveer una opción neutra o permitir la creación al vuelo sin bloquear la operación.

---

## 4. Criterios de Aceptación y Escenarios BDD (Gherkin)

### Escenarios de RF-01.1
#### SC-01.1.1: [Happy Path - Creación con referencia existente]
```gherkin
Given [contexto inicial con entidades maestras existentes]
When [acción observable ejecutada]
Then [resultado observable esperado con vínculo correcto]
```

#### SC-01.1.2: [Zero-State / Catálogo Vacío o Estado Neutro]
```gherkin
Given [el catálogo maestro de referencia no tiene registros]
When [el usuario abre el formulario para crear la entidad dependiente]
Then [el sistema ofrece la opción neutra por defecto o atajo de creación al vuelo]
And [permite guardar sin errores de clave foránea ni bloqueos]
```

---

## 5. Datos Funcionales del Módulo (Entradas y Salidas)

### 5.1 Datos de Entrada
| Parámetro | Tipo Funcional | Requerido | Regla de Validación / Comportamiento ante Catálogo Vacío |
| :--- | :--- | :--- | :--- |
| `campo` | Texto / Número / ID Foráneo | Sí / No | Regla de negocio o valor fallback ("Sin asignar") si el catálogo está vacío |

### 5.2 Datos de Salida / Observables
| Dato | Tipo Funcional | Descripción del Resultado |
| :--- | :--- | :--- |
| `resultado` | Objeto / Lista | Información retornada o reflejada al usuario |
```
