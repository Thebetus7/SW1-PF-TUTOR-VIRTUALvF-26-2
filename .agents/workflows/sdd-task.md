# SDD-Task: Desglose Pragmático por Flujo Funcional y Verificación (SDD)

Este workflow analiza el plan técnico (`docs/specs/XX-nombre/plan.md`) y la especificación funcional (`docs/specs/XX-nombre/spec.md`) para desglosar el desarrollo en un checklist ágil, orientado a **flujos funcionales completos primero y tests de cierre consolidados después**.

> **Filosofía Ágil de Testing (Feature-First con Verificación Fail-Fast)**:
> - **Flujo Completo Primero**: Se implementa la funcionalidad de punta a punta (persistencia, controlador y UI conectada) para que el software sea visible, operable y esté cerrado antes de escribir las pruebas.
> - **Achicamiento del Código de Test**: Cero micro-tests redundantes para DTOs, mappers o getters. Se concentra el testing en **1 o 2 tests de integración/BDD de alto valor** que validan el comportamiento real del usuario.
> - **Invariante Anti-Cuelgues (Fail-Fast Timeout)**: Todo test asíncrono o de UI debe declarar un timeout estricto (3 a 5 segundos) y evitar bucles infinitos de espera (`pumpAndSettle` ciegos con animaciones o streams abiertos). Si algo falla, debe reventar de inmediato para permitir su corrección rápida.

---

## 1. Resolución del Módulo a Desglosar (`[XX.]`)

Cuando el usuario invoque este workflow (`/sdd-task`):
1. **Con Argumento `[XX.]` o `[XX]`**: Localiza la carpeta correspondiente en `docs/specs/` con `plan.md` y `spec.md`.
2. **Sin Argumento**: Selecciona automáticamente el último módulo disponible con `plan.md`.

---

## 2. Estructura Estándar de Tareas por Flujo Funcional

Cada funcionalidad o módulo se desglosa en 4 fases claras y secuenciales:

- `[SETUP]`: Instalación de paquetes, dependencias, tablas base y scaffolding inicial.
- `[IMPL: Flujo Funcional]`: Implementación completa de la funcionalidad de punta a punta (persistencia, caso de uso/controlador y pantalla/diálogo interactivo conectado).
- `[TEST: Cierre & BDD]`: Batería consolidada de pruebas automatizadas (1 test de aceptación BDD observable del flujo completo + tests unitarios solo para lógica crítica) con **timeout estricto**.
- `[VERIFY]`: Ejecución del comando de prueba, validación de linters y confirmación de funcionamiento sin cuelgues.

---

## 3. Plantilla Oficial de Salida: `docs/specs/XX-nombre/tasks.md`

```markdown
# Checklist de Tareas Técnicas: [Nombre del Módulo o Feature]

> Módulo: `docs/specs/XX-nombre/` | Plan Técnico: `plan.md` | Especificación: `spec.md` | Estado: Pendiente

---

## 1. Resumen y Trazabilidad del Desglose

- **Módulo**: [Nombre del feature]
- **Objetivo**: Implementación ágil por flujo funcional completo con batería de verificación consolidada y fail-fast.
- **Historias Cubiertas**: `HU-01` -> `RF-01.1` -> `SC-01.1.1`, `SC-01.1.2`

---

## 2. Desglose de Tareas por Flujo Funcional

### Fase 1: Setup, Paquetes y Scaffolding Base
*Objetivo: Dejar listos los cimientos técnicos y dependencias del módulo.*
- [ ] `T1.1` `[SETUP]`: Configurar dependencias, paquetes del proyecto y tablas/esquemas iniciales en persistencia.

### Fase 2: Implementación del Flujo Funcional de Punta a Punta
*Objetivo: Construir la funcionalidad completa y visible para el usuario (datos, lógica y UI).*
- [ ] `T2.1` `[IMPL: Repositorio & Persistencia]`: Implementar la capa de datos, consultas y manejo de claves foráneas con política antihuérfanos.
- [ ] `T2.2` `[IMPL: Controlador & Lógica de Negocio]`: Implementar el controlador reactivo o caso de uso con estados de carga, éxito y error.
- [ ] `T2.3` `[IMPL: Interfaz de Usuario & Conexión]`: Construir la pantalla o componentes visuales con el selector tridimensional (existente, en caliente y estado neutro/vacío), conectándolo con el controlador.

### Fase 3: Batería Consolidada de Pruebas de Cierre (Fail-Fast)
*Objetivo: Blindar el flujo con tests de alto valor sin redundancias y con timeouts estrictos (máx 5s).*
- [ ] `T3.1` `[TEST: BDD de Aceptación E2E]`: Crear el test de integración de Caja Negra que ejecuta el Happy Path completo (`SC-01.1.1`) con timeout explícito de 5s.
- [ ] `T3.2` `[TEST: Casos de Borde / Estado Vacío]`: Test que verifica el comportamiento ante catálogo vacío o error (`SC-01.1.2`) sin bloquear la interfaz.
- [ ] `T3.3` `[TEST: Lógica Crítica]`: Tests unitarios puntuales únicamente para cálculos de negocio complejos o algoritmos sensibles.

### Fase 4: Verificación Final y Cierre del Módulo
*Objetivo: Certificar la calidad y estabilidad de la solución en ejecución real.*
- [ ] `T4.1` `[VERIFY]`: Ejecutar la suite completa de pruebas del módulo, análisis de linters y verificar que no existan bucles infinitos ni timers huérfanos.
```
