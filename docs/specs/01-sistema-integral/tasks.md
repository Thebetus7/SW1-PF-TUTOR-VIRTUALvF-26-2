# Checklist de Tareas Técnicas: Plataforma LMS Adaptativa (3 Proyectos Independientes)

> Módulo: `docs/specs/01-sistema-integral/` | Plan Técnico: `plan.md` | Especificación: `spec.md` | Estado: Pendiente de Ejecución | Metodología: SDD-Task

---

## 1. Resumen y Trazabilidad del Desglose

- **Arquitectura**: 3 Proyectos Independientes (`backend/`, `frontend-web/`, `frontend-mobile/`).
- **Objetivo**: Implementación integral por flujos funcionales completos y cerrados en 5 Vertical Slices, con Validación Dual (Caja Blanca Jest + Caja Negra BDD Supertest) y diseño Skylearn.
- **Historias Cubiertas**:
  - `HU-01` (Auth, RBAC & 3 Créditos) $\to$ `RF-01.1` - `RF-01.6` $\to$ `SC-01.1.1` - `SC-01.1.3`
  - `HU-02` (Catálogo Curricular & Lecciones) $\to$ `RF-02.1` - `RF-02.4` $\to$ `SC-02.1.1` - `SC-02.1.3`
  - `HU-03` (Cuestionario Opcional de Recomendación) $\to$ `RF-03.1` - `RF-03.4` $\to$ `SC-03.1.1`, `SC-03.1.2`
  - `HU-04` (Rutas Adaptativas con Gemini) $\to$ `RF-04.1` - `RF-04.3` $\to$ `SC-04.1.1`
  - `HU-05` (Consumo, Desbloqueo Permanente & Progreso) $\to$ `RF-05.1` - `RF-05.4` $\to$ `SC-05.1.1` - `SC-05.1.3`
  - `HU-06` (Evaluaciones & Reintentos Libres) $\to$ `RF-06.1` - `RF-06.4` $\to$ `SC-06.1.1`, `SC-06.1.2`
  - `HU-07` (Tutor Virtual 3D & Conclusiones) $\to$ `RF-07.1` - `RF-07.5` $\to$ `SC-07.1.1` - `SC-07.3.1`
  - `HU-08` (Dashboard Móvil Docente & Push) $\to$ `RF-08.1` - `RF-08.5` $\to$ `SC-08.1.1` - `SC-08.1.3`
  - `HU-09` (Billetera Freemium & Stripe Dev Mode) $\to$ `RF-09.1` - `RF-09.3` $\to$ `SC-09.3.1`

---

## 2. Desglose Atómico por Vertical Slice (3 Proyectos)

### Fase 0: Setup de los 3 Proyectos Independientes & Tooling Base
*Objetivo: Inicializar el scaffolding de backend, frontend web y frontend móvil con sus configuraciones y linters.*
- [x] `T0.1` `[SETUP: Backend]`: Inicializar proyecto NestJS 10+ en `backend/` con TypeScript estricto, Prisma ORM (`prisma/schema.prisma`), conexión a PostgreSQL y `PrismaService`.
- [x] `T0.2` `[SETUP: Backend Filters & Swagger]`: Configurar `GlobalHttpExceptionFilter` (RFC 7807), `ValidationPipe` global y Swagger OpenAPI en `backend/src/main.ts`.
- [x] `T0.3` `[SETUP: Frontend Web]`: Inicializar proyecto React (Vite) + TypeScript en `frontend-web/` con los tokens de diseño Skylearn (tipografías Atkinson Hyperlegible y Hubot Sans, variables CSS de colores y radios).
- [x] `T0.4` `[SETUP: Frontend Móvil]`: Inicializar proyecto React Native (Expo) + TypeScript en `frontend-mobile/` enfocado en el Docente con configuración para Expo Push Notifications y tokens Skylearn.

---

### Vertical Slice 1: Core Auth, RBAC & 3 Créditos Iniciales
*Objetivo: Flujo completo de registro, login, asignación automática de 3 créditos iniciales y reset demo para admin.*
*Trazabilidad: `HU-01` $\to$ `RF-01.1` - `RF-01.6` $\to$ `SC-01.1.1`, `SC-01.1.2`, `SC-01.1.3`*

- [x] `T1.1` `[IMPL: Backend Modelos]`: Declarar en `backend/prisma/schema.prisma` los modelos `User` y `CreditAccount` con enum `Role` (`STUDENT`, `TEACHER`, `ADMIN`), relación 1:1 y balance por defecto de 3 créditos.
- [x] `T1.2` `[IMPL: Backend Lógica Auth]`: Crear `RegisterDto`, `LoginDto` y `AuthService` en `backend/src/modules/auth/` con hash `bcrypt`, tokens JWT y asignación automática de `CreditAccount` para `STUDENT`.
- [x] `T1.3` `[IMPL: Backend Endpoints & Seed]`: Implementar `AuthController` (`POST /register`, `POST /login`), `JwtAuthGuard`, `RolesGuard`, `prisma/seed.ts` (usuarios demo) y endpoint `POST /api/v1/admin/reset-demo-data`.
- [x] `T1.4` `[IMPL: Frontend Web Auth]`: Crear en `frontend-web/` las pantallas Skylearn de Login y Register con selector de rol y visualización del badge superior con los 3 créditos iniciales del estudiante.
- [x] `T1.5` `[TEST: BDD Backend]`: Test de integración HTTP en `backend/test/auth.e2e-spec.ts` validando registro exitoso con 3 créditos (`SC-01.1.1`), conflicto por duplicado (`SC-01.1.2`) y reset demo (`SC-01.1.3`).
- [x] `T1.6` `[VERIFY: Slice 1]`: Ejecutar pruebas de Slice 1 y validar compilación en `backend/` y `frontend-web/`.

---

### Vertical Slice 2: Catálogo Curricular & Lecciones (Docente y Alumno)
*Objetivo: Gestión de Cursos, Módulos y Lecciones con enlaces validados de YouTube, botón placeholder y soft-delete tenue.*
*Trazabilidad: `HU-02` $\to$ `RF-02.1` - `RF-02.4` $\to$ `SC-02.1.1`, `SC-02.1.2`, `SC-02.1.3`*

- [x] `T2.1` `[IMPL: Backend Modelos]`: Declarar en `backend/prisma/schema.prisma` los modelos `CourseCategory`, `Course`, `Module` y `Lesson` (con `videoUrl`, `contextText @db.Text` y relación opcional con `Exam`).
- [x] `T2.2` `[IMPL: Backend Servicios Curriculares]`: Implementar `CoursesService` (selector tridimensional con categoría "General" fallback y soft-delete `PATCH /courses/:id/archive`) y `LessonsService` (validación regex canónica de YouTube, almacenamiento de `contextText` y persistencia opcional de `examForm` con preguntas y opciones).
- [x] `T2.3` `[IMPL: Backend Controladores]`: Implementar `CoursesController` y `LessonsController` con protección `@Roles(Role.TEACHER)` y validación estricta de `CreateLessonDto`.
- [x] `T2.4` `[IMPL: Frontend Web Catálogo & Editor Docente]`: Crear en `frontend-web/` el editor de lecciones para el docente (enlace de YouTube, variable de contexto del video y constructor dinámico de formulario evaluativo con opciones y marcado de la correcta) y la vista de lección para el estudiante con reproductor embebido de YouTube.
- [x] `T2.5` `[TEST: BDD Backend]`: Test en `backend/test/courses.e2e-spec.ts` validando creación con categoría fallback (`SC-02.1.1`), lección con YouTube, contexto del video y formulario opcional (`SC-02.1.2`) y soft-delete tenue con alumnos inscritos (`SC-02.1.3`).
- [x] `T2.6` `[VERIFY: Slice 2]`: Ejecutar pruebas de Slice 2 y validar linter.

---

### Vertical Slice 3: Cuestionario Inicial & Motor de Rutas Adaptativas (Google Gemini)
*Objetivo: Cuestionario opcional de 3 a 5 preguntas con incisos y compilación automática de la Ruta de Aprendizaje Personalizada con IA a costo 0.*
*Trazabilidad: `HU-03`, `HU-04` $\to$ `RF-03.1` - `RF-03.4`, `RF-04.1` - `RF-04.3` $\to$ `SC-03.1.1`, `SC-03.1.2`, `SC-04.1.1`*

- [x] `T3.1` `[IMPL: Backend GeminiService]`: Implementar `GeminiService` con cliente de Google AI Studio, timeout de 8s, 2 reintentos con backoff exponencial e interceptor de Fallback Heurístico Determinista ante errores HTTP 429.
- [x] `T3.2` `[IMPL: Backend Modelos Rutas]`: Declarar en Prisma los modelos `LearningPath`, `PathNode` y `Enrollment`.
- [x] `T3.3` `[IMPL: Backend Recomendaciones]`: Implementar `RecommendationsService` para emitir cuestionario breve (`GET /quiz`) y procesar respuestas (`POST /quiz/submit`) ensamblando la `LearningPath` adaptativa con Gemini/fallback a costo 0 de créditos.
- [x] `T3.4` `[IMPL: Frontend Web Quiz & Ruta]`: Crear en `frontend-web/` el componente `Answer Tile` Skylearn para las preguntas del cuestionario con botón directo "Comenzar Lección / Ir al Curso" y la opción "Omitir y ver catálogo".
- [x] `T3.5` `[TEST: BDD Backend]`: Test en `backend/test/recommendations.e2e-spec.ts` validando cuestionario con generación de ruta a costo 0 (`SC-03.1.1`), omisión directa (`SC-03.1.2`) y fallback ante saturación de Gemini (`SC-04.1.1`).
- [x] `T3.6` `[VERIFY: Slice 3]`: Ejecutar pruebas de Slice 3.

---

### Vertical Slice 4: Desbloqueo Permanente, Progreso Híbrido, Paywall & Stripe Developer Mode
*Objetivo: Deducción de crédito al primer acceso, desbloqueo permanente, paywall interactivo con tarjeta 4242 y webhooks idempotentes.*
*Trazabilidad: `HU-05`, `HU-09` $\to$ `RF-05.1` - `RF-05.4`, `RF-09.1` - `RF-09.3` $\to$ `SC-05.1.1` - `SC-05.1.3`, `SC-09.3.1`*

- [x] `T4.1` `[IMPL: Backend Modelos Acceso y Pagos]`: Declarar en Prisma `LessonUnlock`, `LessonProgress`, `Subscription` y `ProcessedWebhookEvent`.
- [x] `T4.2` `[IMPL: Backend Lógica Desbloqueo & Progreso]`: Implementar en `LessonsService`: verificar `LessonUnlock`; si es primer acceso, debitar 1 crédito y marcar desbloqueada permanentemente; registrar completitud (botón manual o examen) y endpoint `POST /api/v1/progress/sync-batch`.
- [x] `T4.3` `[IMPL: Backend Stripe & Webhooks]`: Implementar `PaymentsService` en Developer Mode: emitir HTTP 402 si balance=0, generar CheckoutSession con tarjeta `4242 4242 4242 4242`, procesar webhook idempotente y crear helper de test HMAC-SHA256.
- [x] `T4.4` `[IMPL: Frontend Web Paywall Modal]`: Crear en `frontend-web/` el modal de Paywall Skylearn al recibir HTTP 402 con botón de pago e integración de checkout.
- [x] `T4.5` `[TEST: BDD Backend]`: Test en `backend/test/payments-progress.e2e-spec.ts` validando débito inicial y posterior reapertura sin costo (`SC-05.1.1`), paywall HTTP 402 (`SC-05.1.2`), completitud híbrida (`SC-05.1.3`) y webhook Stripe con tarjeta 4242 activando suscripción (`SC-09.3.1`).
- [x] `T4.6` `[VERIFY: Slice 4]`: Ejecutar pruebas de Slice 4.

---

### Vertical Slice 5: Evaluaciones, Tutor Virtual 3D & Dashboard Móvil Docente
*Objetivo: Exámenes formativos con reintentos libres, Tutor Virtual 3D interactivo en Web y Dashboard Móvil Docente con notificaciones push en React Native.*
*Trazabilidad: `HU-06`, `HU-07`, `HU-08` $\to$ `RF-06.1` - `RF-06.4`, `RF-07.1` - `RF-07.5`, `RF-08.1` - `RF-08.5` $\to$ `SC-06.1.1`, `SC-06.1.2`, `SC-07.1.1` - `SC-07.3.1`, `SC-08.1.1` - `SC-08.1.3`*

- [x] `T5.1` `[IMPL: Backend Modelos Evaluativos & Tutor]`: Declarar en Prisma `Exam`, `Question`, `Option`, `ExamAttempt`, `AttemptAnswer`, `TutorEvaluationResult` y campo `pushToken` en `User`.
- [x] `T5.2` `[IMPL: Backend Exámenes & Tutor Stateless]`: Implementar `ExamsService` (umbral 70%, reintentos libres inmutables con nota máxima) y `TutorService` (audio Base64/texto, 5 a 8 preguntas, cálculo de visemas y reporte con botón de ruta).
- [x] `T5.3` `[IMPL: Backend Dashboard Móvil & Push]`: Implementar `AnalyticsService`: `GET /api/v1/teacher/dashboard` (3 KPIs + semáforo y lección crítica), `POST /api/v1/teacher/device-token` y despacho de notificación push efímera al inscribirse un alumno.
- [x] `T5.4` `[IMPL: Frontend Web Avatar 3D & Examen]`: Crear en `frontend-web/` el componente de resolución de exámenes con `AnswerTile` Skylearn (validación determinista por clic en una opción), el componente de Tutor Virtual 3D (Three.js con visemas sincronizados y diálogo por voz/texto) y pantalla de Quiz Score Card.
- [x] `T5.5` `[IMPL: Frontend Móvil Docente]`: Crear en `frontend-mobile/` (React Native Expo) la pantalla `DashboardDocente` con 3 KPIs superiores, tarjetas con semáforo pedagógico (`leaf`, `sun`, `coral`), detalle de lección crítica y registro de Expo Push Token.
- [x] `T5.6` `[TEST: BDD Backend]`: Test en `backend/test/tutor-analytics.e2e-spec.ts` validando examen reprobado (`SC-06.1.1`), reintento con nota máxima (`SC-06.1.2`), sesión del tutor con visemas (`SC-07.1.1` - `SC-07.3.1`), dashboard móvil (`SC-08.1.2`) y notificación push por inscripción (`SC-08.1.3`).
- [x] `T5.7` `[VERIFY: Ecosistema Completo]`: Ejecutar suite de pruebas completa en `backend/`, verificar compilación en `frontend-web/` y `frontend-mobile/`, y validar linters sin errores.

---

## 3. Iteración Anclada: Jerarquía Curricular, Pre-Inscripción & Hash Router
*Objetivo: Corregir la experiencia de usuario garantizando que los docentes creen cursos y organicen sus lecciones y formularios de examen con persistencia visual inmediata; que los estudiantes puedan explorar el temario completo de un curso y matricularse explícitamente antes de acceder a las lecciones; y que la flecha "Atrás" del navegador mantenga el historial dentro de la aplicación mediante Hash Routing.*
*Trazabilidad: `HU-02`, `HU-05`, `HU-10` $\to$ `RF-02.6`, `RF-05.5`, `RF-10.1` $\to$ `SC-02.1.4`, `SC-05.1.4`, `SC-10.1.1`*

### Vertical Slice 6: Navegación con Historial, Pre-Inscripción y Gestión Curricular
- [x] `T6.1` `[IMPL: Backend Endpoints Matrícula & Detalle Curso]`: Asegurar y validar en `CoursesController` / `CoursesService` los endpoints `GET /api/v1/courses/:id` (con módulos, lecciones y flag `isEnrolled`) y `POST /api/v1/courses/:id/enroll` (con notificación push al docente).
- [x] `T6.2` `[IMPL: Frontend Web Hash Router]`: Implementar Hash Router reactivo en `frontend-web/` escuchando eventos `hashchange` y `popstate`, con rutas `#/courses`, `#/courses/:id`, `#/lessons/:id`, `#/teacher/courses`, asegurando que la flecha "Atrás" del navegador navegue al nivel jerárquico anterior sin salir de la aplicación (`SC-10.1.1`).
- [x] `T6.3` `[IMPL: Frontend Web Detalle de Curso y Pre-Inscripción]`: Crear componente `CourseDetailPage.tsx` donde el estudiante visualiza la ficha del curso, datos del docente, temario completo de lecciones y botón destacado "Inscribirme al Curso" que efectúa la matrícula y habilita el acceso a las lecciones (`SC-05.1.4`).
- [x] `T6.4` `[IMPL: Frontend Web Jerarquía Curricular Docente]`: Implementar panel `TeacherCourseManager.tsx` con listado de cursos del docente, creador de curso con selector de categoría, explorador de lecciones dentro del curso y modal/formulario integrado para añadir lecciones y preguntas de examen con persistencia y visualización inmediata (`SC-02.1.4`).
- [x] `T6.5` `[TEST: BDD & Dual Verification]`: Agregar suite BDD en `backend/test/course-enrollment.e2e-spec.ts` validando el detalle de curso con temario, inscripción con notificación push al docente y rechazo de lección sin inscripción previa.
- [x] `T6.6` `[VERIFY: E2E & Build Completo]`: Ejecutar suite completa de tests de backend (`npm run test:backend`), validar compilación limpia en `frontend-web` (`npm run build`) y verificar interactividad fluida con la flecha Atrás en el navegador.


