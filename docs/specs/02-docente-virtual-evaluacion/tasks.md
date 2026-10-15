# Checklist de Tareas Técnicas: Evaluación Interactiva con Docente Virtual Humanoide

> Módulo: `docs/specs/02-docente-virtual-evaluacion/` | Plan Técnico: `plan.md` | Especificación: `spec.md` | Estado: Completado | Metodología: SDD-Task

---

## 1. Resumen y Trazabilidad del Desglose

- **Módulo**: `02-docente-virtual-evaluacion`
- **Objetivo**: Implementación completa de extremo a extremo de la evaluación guiada por un Docente Virtual humanoide 2.5D en HTML5 Canvas con movimiento de brazos y labios, ciclo adaptativo de 1 pregunta por lección, entrada por voz (Web Speech API) y texto, modal de auditoría de datos recopilados, y verificación en vivo de Google Gemini.
- **Historias de Usuario Cubiertas**:
  - `HU-01` $\to$ `RF-01.1`, `RF-01.2`, `RF-01.3`, `RF-01.4` $\to$ `SC-01.1`, `SC-01.2`, `SC-01.3`
  - `HU-02` $\to$ `RF-02.1`, `RF-02.2`, `RF-02.3`, `RF-02.4` $\to$ `SC-02.1`, `SC-02.2`, `SC-02.3`
  - `HU-03` $\to$ `RF-03.1`, `RF-03.2`, `RF-03.3`, `RF-03.4`, `RF-03.5`, `RF-03.6` $\to$ `SC-03.1`, `SC-03.2`
  - `HU-04` $\to$ `RF-04.1`, `RF-04.2`, `RF-04.3`, `RF-04.4`, `RF-04.5` $\to$ `SC-04.1`, `SC-04.2`

---

## 2. Desglose de Tareas por Flujo Funcional

### Fase 1: Setup, Tipos y DTOs Base
*Objetivo: Establecer los contratos de datos en backend y frontend para la evaluación modular y el diagnóstico de la IA.*
- [x] `T1.1` `[SETUP: DTOs Backend]`: Crear los DTOs tipados en `backend/src/modules/tutor/dto/`:
  - `test-connection.dto.ts` con validación de modo demo.
  - `module-evaluation.dto.ts` (`StartModuleEvaluationDto`, `AnswerModuleEvaluationDto`).
- [x] `T1.2` `[SETUP: Tipos Frontend]`: Definir los contratos e interfaces TypeScript en `frontend-web/src/types/tutor.types.ts` (`AvatarPoseType`, `VisemeShape`, `VisemeFrame`, `ModuleEvaluationContext`, `EvaluationTurnState`).

---

### Fase 2: Implementación de Backend (Servicios, Controladores y Persistencia)
*Objetivo: Habilitar los endpoints de prueba de conexión, inicio de evaluación modular, calificación turno a turno con Gemini y registro de intentos.*
- [x] `T2.1` `[IMPL: Backend Diagnóstico Google Gemini]`: Implementar en `TutorService` y `TutorController` el método `testGeminiConnection()` (`POST /tutor/test-connection`) que genera una frase dinámica espontánea con Gemini, visemas asociados y timestamp en vivo.
- [x] `T2.2` `[IMPL: Backend Orquestación de Evaluación Modular]`: Implementar en `TutorService` y `TutorController`:
  - `startModuleEvaluation(userId, dto)` (`POST /tutor/module-evaluation/start`): recopila lecciones del módulo, crea en caliente el `Exam` modular si no existe (patrón selector tridimensional), y genera la pregunta para la Lección 1 con Gemini.
  - `getModuleCollectedContext(moduleId)`: retorna el contexto pedagógico y lista de lecciones para el modal de auditoría.
- [x] `T2.3` `[IMPL: Backend Calificación y Persistencia de Intento]`: Implementar `answerModuleEvaluation(userId, dto)` (`POST /tutor/module-evaluation/answer`):
  - Califica la respuesta (voz o texto) con respecto al `contextText` de la lección actual.
  - Retorna `avatarEmotion` (`explaining`, `celebrating`, `encouraging`), visemas y la siguiente pregunta.
  - Al completar la última lección, persiste atómicamente el `ExamAttempt` en PostgreSQL con costo 0 créditos y emite el dictamen final.

---

### Fase 3: Implementación de Frontend (Avatar Humano, Modal de Contexto y Flujo UI)
*Objetivo: Construir los componentes visuales interactivos y conectarlos al temario del estudiante.*
- [x] `T3.1` `[IMPL: Componente HumanAvatarCanvas]`: Crear `frontend-web/src/components/HumanAvatarCanvas.tsx` con renderizado en HTML5 Canvas de alta fidelidad:
  - Cabeza estilizada con ojos expresivos, parpadeo periódico y boca sincronizada con visemas.
  - Torso y cinemática de brazos articulados reactivos a las posturas: reposo (`idle`), gesticulación didáctica (`explaining`), atención con mano al mentón (`listening`), y celebración con pulgar arriba (`celebrating`).
- [x] `T3.2` `[IMPL: Componente CollectedContextModal]`: Crear `frontend-web/src/components/CollectedContextModal.tsx` para mostrar con total transparencia las lecciones del módulo, los textos de contexto (`contextText`) y los objetivos formativos que alimentan a la IA.
- [x] `T3.3` `[IMPL: Integración en Temario CourseDetailPage]`: Actualizar `frontend-web/src/pages/CourseDetailPage.tsx`:
  - Renderizar al final de cada módulo la tarjeta "Evaluación Práctica con Docente Virtual".
  - Botón "Comenzar Evaluación (Demo)" con 0 créditos requeridos (sin bloqueo por paywall).
  - Botón "Detalles de Recopilación" conectado a `CollectedContextModal`.
  - Manejo de fallback amigable si el módulo no posee lecciones (*Zero-State Invariant*).
- [x] `T3.4` `[IMPL: Componente VirtualTutorEvaluatorModal]`: Crear `frontend-web/src/components/VirtualTutorEvaluatorModal.tsx`:
  - Integrar `HumanAvatarCanvas` con animaciones sincronizadas al audio.
  - Botón discreto "Probar Conexión IA" con llamada en vivo a Google Gemini, audio instantáneo e insignia de estado.
  - Botón de micrófono intuitivo (1 clic) con Web Speech API (`webkitSpeechRecognition`), animación de ondas sonoras y conmutación automática de turnos.
  - Campo de texto alternativo para responder por escrito.
  - Síntesis de voz automática (Web Speech Synthesis / TTS) que pronuncia las preguntas y retroalimentaciones mientras el avatar mueve sus labios y brazos.
  - Pantalla final de dictamen pedagógico con felicitación y retorno al temario.

---

### Fase 4: Batería Consolidada de Pruebas de Cierre (Fail-Fast)
*Objetivo: Garantizar la solidez del sistema con pruebas de integración y unitarias de ejecución rápida ($\le 5\text{s}$).*
- [x] `T4.1` `[TEST: Backend BDD E2E Fail-Fast]`: Suite de pruebas E2E en `backend/test/tutor.e2e-spec.ts`:
  - Prueba de `POST /tutor/test-connection` con verificación de estructura y visemas (PASS).
  - Prueba del flujo completo de evaluación modular (`start` $\to$ `answer` $\to$ persistencia de `ExamAttempt` sin descuento de créditos) (PASS).
  - Manejo de errores controlados ante módulo inexistente o sin lecciones (PASS).
- [x] `T4.2` `[TEST: Frontend / Lógica de Visemas y Avatar]`: Suite unitaria `backend/src/modules/tutor/tutor.service.spec.ts` con Vitest para visemas anatómicos y tiempo monótono (PASS).

---

### Fase 5: Verificación Final y Cierre del Módulo
*Objetivo: Ejecutar la validación completa en el entorno real y certificar higiene de código.*
- [x] `T5.1` `[VERIFY: Build y Linters]`: `npm run build` ejecutado exitosamente en `backend` y `frontend-web` con 0 errores TypeScript.
- [x] `T5.2` `[VERIFY: Ejecución de Tests]`: Suite de 7 pruebas BDD E2E + 3 pruebas unitarias pasando al 100% en verde sin fallos ni bloqueos.
