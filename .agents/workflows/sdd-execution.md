# SDD-Execution: Ejecución de Flujos Funcionales, Cero Cuelgues y Verificación (SDD)

Este workflow guía al asistente de IA en la **implementación física del código**, resolviendo las tareas de `docs/specs/XX-nombre/tasks.md` bajo el principio de **flujos funcionales completos primero y verificación consolidada fail-fast después**.

> **Regla de Oro Anti-Cuelgues y Autonomía de Copiloto**:
> 1. **Flujo Funcional Antes de Testear**: Al implementar `[IMPL]`, la IA construye el flujo de punta a punta (persistencia, lógica y UI conectada) para que el software sea tangible, operable y estable.
> 2. **Timeouts Obligatorios (Fail-Fast)**: Todo test automatizado `[TEST]` debe incluir un timeout explícito estricto (3 a 5 segundos). Si un test no responde, debe fallar de inmediato y mostrar el error, **quedando terminantemente prohibido dejar que el runner se congele en bucles infinitos**.
> 3. **Cero Esperas Ciegas en UI**: En tests de widgets o UI, se prohíbe el uso de `pumpAndSettle()` ciegos ante animaciones infinitas o timers activos; se deben usar `pump()` con duraciones controladas o bombear únicamente los frames necesarios.

---

## 1. Resolución del Módulo a Ejecutar (`[XX.]`)

Cuando el usuario invoque este workflow (`/sdd-execution`):
1. **Con Argumento `[XX.]` o `[XX]`**: Localiza la carpeta correspondiente en `docs/specs/` con `tasks.md`.
2. **Sin Argumento**: Selecciona automáticamente el último módulo disponible con tareas pendientes.

---

## 2. Mapa de Contexto del Asistente

Antes de escribir cualquier línea de código, el asistente debe inspeccionar:
- `docs/constitution.md`: Stack tecnológico, estándares de codificación y comandos del proyecto.
- `docs/specs/XX-nombre/spec.md`: Escenarios Gherkin `SC-XX.Y.Z` y datos funcionales.
- `docs/specs/XX-nombre/plan.md`: Contratos tipados, persistencia física y diagramas de secuencia.
- `docs/specs/XX-nombre/tasks.md`: Lista de tareas pendientes (`[ ]`).

---

## 3. Protocolo de Ejecución por Fases

El asistente toma la primera tarea pendiente (`[ ]`) del archivo `tasks.md` y aplica el ciclo correspondiente:

1. **Si la tarea es `[SETUP]`**:
   - Instala paquetes y dependencias necesarias.
   - Crea la estructura base de directorios y esquemas iniciales de persistencia.
2. **Si la tarea es `[IMPL]`**:
   - Implementa el código de producción (repositorios, controladores y vistas UI conectadas).
   - Asegura que los streams y recursos tengan cierres limpios y que las pantallas manejen los estados de carga, éxito y error.
3. **Si la tarea es `[TEST]`**:
   - Escribe el test consolidado (BDD o unitario crítico) configurando un **timeout explícito de 3 a 5 segundos**:
     ```dart // o jest.setTimeout(5000) en JS/TS
     testWidgets('Flujo observable E2E', (tester) async {
       // ...
     }, timeout: const Timeout(Duration(seconds: 5)));
     ```
   - Ejecuta el test y confirma que pasa al 100% en verde sin congelarse ni demorarse.
4. **Si la tarea es `[VERIFY]`**:
   - Ejecuta la suite de pruebas del módulo y análisis de linters, garantizando cero advertencias, cero regresiones y cero bloqueos.

---

## 4. Cierre Físico Inmediato en `tasks.md`

- Inmediatamente después de verificar que el comando de test o verificación fue exitoso, el asistente actualiza `docs/specs/XX-nombre/tasks.md` marcando la tarea con una `[x]`.
- Prohibido marcar tareas como completadas sin haber ejecutado y verificado físicamente los comandos correspondientes.
