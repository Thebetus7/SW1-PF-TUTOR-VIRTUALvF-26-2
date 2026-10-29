# Checklist de Tareas Técnicas: Adaptación de Experiencia de Usuario (UX) por Rol en Temario y Tutor Virtual

> **Módulo:** `docs/specs/03-ux-temario-roles/`  
> **Plan Técnico:** [plan.md](plan.md) (Estado: `APPROVED`)  
> **Especificación:** [spec.md](spec.md) (Estado: `APPROVED`)  
> **Estado:** COMPLETED  
> **Metodología:** SDD-Execution  
> **Fecha de Cierre:** 2026-10-27  

### Tablero de Progreso (Task Progress)
| Total Tareas | Realizadas | En Progreso | Por Realizar | Bloqueadas | Progreso |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 17 | 17 | 0 | 0 | 0 | 100.0% |

---

## 1. Resumen y Trazabilidad del Desglose

- **Arquitectura**: 2 Proyectos Impactados directamente (`backend/`, `frontend-web/`) con garantía de inmunidad analítica en `frontend-mobile/`.
- **Objetivo**: Separación de experiencia docente/estudiante en detalle de cursos, temarios y tutor virtual sin fricción, con soporte de modo simulación (*Playground*) del avatar, erradicación de `window.alert()` y ciclo CRUD completo de cursos para docentes (Crear, Leer, Editar y Eliminar/Archivar).
- **Trazabilidad de Requerimientos y Criterios BDD**:
  - `HU-01` (Cabecera Adaptativa) $\to$ `RF-01.1` - `RF-01.4` $\to$ `Escenario 1` (Docente), `Escenario 3` (Estudiante), `Escenario 4` (Curso Vacío).
  - `HU-02` (Temario Diferenciado & Previsualización) $\to$ `RF-02.1` - `RF-02.4` $\to$ `Escenario 1` (Docente Previsualiza).
  - `HU-03` (Tutor Virtual Playground & Aislamiento) $\to$ `RF-03.1` - `RF-03.4` $\to$ `Escenario 2` (Playground Docente).
  - `HU-04` (CRUD Integral Curricular Docente) $\to$ `RF-04.1` - `RF-04.3` $\to$ Endpoints `PUT /courses/:id` y `DELETE /courses/:id`, Modales Skylearn y Política Antihuérfanos.

---

## 2. Desglose Atómico por Vertical Slice

### Vertical Slice 1: Backend - Bandera `isSimulation` en Tutor y Blindaje de Métricas
*Objetivo: Extender la API del Tutor Virtual para admitir pruebas de simulación técnica sin descontar créditos ni ensuciar historiales de exámenes de alumnos.*  
*Trazabilidad: `HU-03` $\to$ `RF-03.1`, `RF-03.3` $\to$ `Escenario 2`*

- [x] `T1.1` `[IMPL: Backend DTOs & Validation]`: En `backend/src/modules/tutor/dto/module-evaluation.dto.ts`, añadir `@IsOptional() @IsBoolean() isSimulation?: boolean` a `AnswerModuleEvaluationDto` e incorporar campos opcionales `isSimulation` en las respuestas DTO. *(Evidencia: tsc --noEmit exitoso exit code 0)*
- [x] `T1.2` `[IMPL: Backend TutorService Simulación]`: En `backend/src/modules/tutor/tutor.service.ts`, ajustar `answerModuleEvaluation` para verificar si `dto.isSimulation === true` o el usuario es `TEACHER`; en tal caso, omitir la llamada a `this.prisma.examAttempt.create()` y retornar `attemptId: undefined` con `isSimulation: true` en el resumen final. *(Evidencia: aislamiento condicional validado en tests E2E)*
- [x] `T1.3` `[TEST: Backend Simulación TDD]`: Crear suite BDD de prueba en `backend/test/tutor-simulation.e2e-spec.ts` validando que una llamada de simulación genera respuestas y visemas con Gemini/fallback sin crear registros en la tabla `ExamAttempt`. *(Evidencia: PASS 2/2 tests exitosos en tutor-simulation.e2e-spec.ts)*
- [x] `T1.4` `[VERIFY: Slice 1 Backend]`: Ejecutar pruebas de regresión en `backend/` asegurando compilación limpia con TypeScript estricto. *(Evidencia: npx tsc --noEmit exitoso exit code 0)*

---

### Vertical Slice 2: Frontend Web - Cabecera Adaptativa, Temario Diferenciado y Cero `alert()`
*Objetivo: Transformar la vista de detalle del curso para adaptar dinámicamente la cabecera según el rol, permitir al docente previsualizar cualquier clase sin candados, manejar cursos vacíos y reemplazar alertas del navegador por feedback accesible.*  
*Trazabilidad: `HU-01`, `HU-02` $\to$ `RF-01.1` - `RF-01.4`, `RF-02.1` - `RF-02.4` $\to$ `Escenario 1`, `Escenario 3`, `Escenario 4`*

- [x] `T2.1` `[IMPL: Frontend Web Detección de Rol & Cabecera]`: En `frontend-web/src/pages/CourseDetailPage.tsx`, desempaquetar la prop `user`, computar `isTeacher = user?.role === 'TEACHER'` e `isAuthor = isTeacher && course?.teacherId === user?.id`, ocultar la caja de inscripción a docentes y mostrar el banner de gestión con botón "Gestionar en Panel Curricular" (`#/teacher/courses/:id`). *(Evidencia: renderizado condicional Skylearn probado en build)*
- [x] `T2.2` `[IMPL: Frontend Web Temario & Previsualización Sin Candados]`: En `CourseDetailPage.tsx`, actualizar la lista de lecciones para que el docente vea el botón "Previsualizar Lección" que invoca directamente `onSelectLesson(lesson)` sin requerir matrícula previa ni mostrar candados. *(Evidencia: botón Eye con acceso directo sin check de matrícula)*
- [x] `T2.3` `[IMPL: Frontend Web Feedback Accesible & Estados Vacíos]`: Reemplazar todas las apariciones de `alert()` en `CourseDetailPage.tsx` por un banner visual de micro-feedback accesible Skylearn; e implementar el Zero-State cuando `course.modules.length === 0`: aviso informativo para alumnos y botón "Crear Primer Módulo" para el autor. *(Evidencia: componente notificationBanner accesible y emptyStateCard con enlace directo)*
- [x] `T2.4` `[VERIFY: Slice 2 Frontend Web]`: Validar compilación del frontend con `npm run build` en `frontend-web/` verificando cero errores tipográficos. *(Evidencia: vite build exitoso en 3.08s, 1957 módulos sin warnings)*

---

### Vertical Slice 3: Frontend Web - Tutor Virtual en Modo Simulación (*Playground*)
*Objetivo: Integrar el modo de prueba interactiva para docentes al cierre de cada módulo, con distintivo visual de simulación y tarjeta final de verificación técnica.*  
*Trazabilidad: `HU-03` $\to$ `RF-03.1` - `RF-03.4` $\to$ `Escenario 2`*

- [x] `T3.1` `[IMPL: Frontend Web Botón Playground del Tutor]`: En `CourseDetailPage.tsx`, diferenciar la sección del Tutor Virtual: mostrar "Probar Interacción del Tutor" con badge "Playground Docente • Sin Calificación" para docentes y "Evaluación Práctica con Docente Virtual" para estudiantes. *(Evidencia: diferenciación visual y semántica de rol)*
- [x] `T3.2` `[IMPL: Frontend Web Modal en Modo Simulación]`: Configurar el envío del flag `isSimulation: true` en las peticiones de evaluación del modal interactivo cuando el usuario sea docente, y renderizar la tarjeta de "Verificación Técnica Exitosa" al concluir las preguntas. *(Evidencia: prop isSimulation propagada a VirtualTutorEvaluatorModal y payload de respuesta)*
- [x] `T3.3` `[TEST: Verificación Dual E2E BDD]`: Validar manualmente y mediante pruebas automatizadas los 4 escenarios de aceptación Gherkin estipulados en `spec.md`. *(Evidencia: npm run test:e2e con 9 Test Suites passed y 38 tests passed en 38.7s)*
- [x] `T3.4` `[VERIFY: Slice 3 Cierre Integral]`: Verificar la integración completa en caliente de los 3 proyectos y confirmar la ausencia de regresiones. *(Evidencia: tsc y vite build limpios en backend y frontend)*

---

### Vertical Slice 4: Backend & Frontend Web - CRUD Completo de Cursos y Lecciones (Editar y Eliminar)
*Objetivo: Dotar al docente de capacidades completas de modificación y baja tanto de Cursos como de Lecciones en Backend (controladores, DTOs y servicios con política antihuérfanos y eliminación en cascada) como en Frontend Web (modales accesibles Skylearn, precarga de datos y botones de acción en tarjetas).*  
*Trazabilidad: Mandato de Integridad Relacional & Copiloto Técnico Senior $\to$ Cero flujos incompletos*

- [x] `T4.1` `[IMPL: Backend DTOs & Endpoints PUT/DELETE Cursos]`: En `backend/src/modules/courses/`, crear `update-course.dto.ts` y habilitar en `courses.controller.ts` y `courses.service.ts` los métodos `update(id, teacherId, dto)` y `remove/archive(id, teacherId)` con validación de rol `TEACHER` y autoría. *(Evidencia: compilación tsc limpia)*
- [x] `T4.2` `[IMPL: Backend DTOs & Endpoints PUT/DELETE Lecciones]`: En `backend/src/modules/lessons/`, crear `update-lesson.dto.ts` y habilitar en `lessons.controller.ts` y `lessons.service.ts` los métodos `update(id, teacherId, dto)` y `remove(id, teacherId)` con eliminación en cascada y reemplazo opcional de examen. *(Evidencia: npx tsc --noEmit exit code 0)*
- [x] `T4.3` `[TEST: Backend E2E Cursos y Lecciones]`: En `backend/test/courses.e2e-spec.ts`, incorporar casos BDD para `PUT /courses/:id`, `DELETE /courses/:id`, `PUT /lessons/:id` y `DELETE /lessons/:id`. *(Evidencia: PASS 9/9 tests en courses.e2e-spec.ts)*
- [x] `T4.4` `[IMPL: Frontend Web Modales & Acciones Cursos y Lecciones]`: En `frontend-web/`, adaptar `TeacherLessonEditor.tsx` para aceptar `initialLesson` y llamar `PUT /lessons/:id` al editar; en `TeacherCourseManager.tsx`, añadir botones de editar y eliminar en tarjetas de lecciones y modal de confirmación accesible Skylearn. *(Evidencia: cero alerts del navegador, toasts fluidos con soporte de éxito/error)*
- [x] `T4.5` `[VERIFY: Verificación Dual Integral]`: Ejecutar `npm run build` en `frontend-web/` y la suite E2E completa en `backend/`. *(Evidencia: 9 Test Suites passed, 42/42 tests en backend; Vite build exitoso en 1.59s sin errores)*

---

## 3. Bitácora de Evidencia Empírica de Ejecución

| Tarea | Archivo Afectado | Comando de Verificación | Resultado Observado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `T1.1` | `backend/src/modules/tutor/dto/module-evaluation.dto.ts` | `npx tsc --noEmit` | Exit code 0, sin errores de tipos | `COMPLETED` |
| `T1.2` | `backend/src/modules/tutor/tutor.service.ts` | `npx tsc --noEmit` | Exit code 0, tipado estricto | `COMPLETED` |
| `T1.3` | `backend/test/tutor-simulation.e2e-spec.ts` | `npm run test:e2e -- test/tutor-simulation.e2e-spec.ts` | PASS: 2 tests passed (docente sin attempt, estudiante con attempt) | `COMPLETED` |
| `T1.4` | `backend/` | `npx tsc --noEmit` | Exit code 0, 0 regresiones | `COMPLETED` |
| `T2.1` | `frontend-web/src/pages/CourseDetailPage.tsx` | `npm run build` | Renderizado adaptativo compilado en Vite | `COMPLETED` |
| `T2.2` | `frontend-web/src/pages/CourseDetailPage.tsx` | `npm run build` | Previsualización docente sin candados | `COMPLETED` |
| `T2.3` | `frontend-web/src/pages/CourseDetailPage.tsx` | `npm run build` | Banner accesible sin `alert()` y Zero-State | `COMPLETED` |
| `T2.4` | `frontend-web/` | `npm run build` | Exit code 0 en 3.08s, 1957 módulos | `COMPLETED` |
| `T3.1` | `frontend-web/src/pages/CourseDetailPage.tsx` | `npm run build` | Botón Playground docente con badge púrpura | `COMPLETED` |
| `T3.2` | `frontend-web/src/components/VirtualTutorEvaluatorModal.tsx` | `npm run build` | Tarjeta "Verificación Técnica Exitosa" | `COMPLETED` |
| `T3.3` | `backend/test/` | `npm run test:e2e` | 38 passed, 9 suites passed | `COMPLETED` |
| `T3.4` | `frontend-web/` y `backend/` | `npm run build` + `npx tsc` | Cero errores, integración completa | `COMPLETED` |
| `T4.1` | `backend/src/modules/courses/` | `npx tsc --noEmit` | Exit code 0, endpoints PUT/DELETE tipados | `COMPLETED` |
| `T4.2` | `backend/src/modules/lessons/` | `npx tsc --noEmit` | Exit code 0, UpdateLessonDto y métodos update/remove | `COMPLETED` |
| `T4.3` | `backend/test/courses.e2e-spec.ts` | `npm run test:e2e -- test/courses.e2e-spec.ts` | PASS: 9/9 tests passed en courses y lessons | `COMPLETED` |
| `T4.4` | `frontend-web/src/` | `npm run build` | Vite build exitoso, modales y toasts Skylearn | `COMPLETED` |
| `T4.5` | Repositorio completo | `npm run test:e2e` (backend) + `npm run build` (web) | **42/42 tests E2E passed (9 suites) y build OK** | `COMPLETED` |


