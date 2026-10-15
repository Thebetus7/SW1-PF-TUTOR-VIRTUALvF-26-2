# Especificación Funcional Integral: Plataforma LMS Adaptativa e Inteligente

> Módulo: `docs/specs/01-sistema-integral/` | Versión: 1.2.0 | Estado: Iteración Anclada (Jerarquía Curricular & Navegación) | Metodología: SDD-Spec-Anchored

---

## 1. Contexto, Objetivos y Anclaje al Flujo Global

### 1.1 Objetivo del Sistema
La plataforma tiene como propósito ofrecer un entorno de aprendizaje adaptativo integral que personalice la formación del estudiante en función de sus competencias reales, optimice la gestión docente mediante analíticas de dificultad y asegure la sostenibilidad del servicio a través de un modelo económico freemium respaldado por Stripe.

### 1.2 Ubicación en el Flujo Global (docs/constitution.md)
Este documento formaliza y abarca la totalidad del ciclo de vida del producto definido en la Constitución:
1. **Fase I**: Diagnóstico vocacional, evaluación inicial y compilación de rutas adaptativas con Google Gemini API.
2. **Fase II**: Consumo de lecciones (YouTube + materiales), seguimiento de progreso y evaluación formativa con tutoría virtual 3D.
3. **Fase III**: Gobernanza económica (billetera de 3 créditos de bienvenida, paywall y suscripción SaaS).
4. **Fase IV**: Inteligencia pedagógica y analítica de puntos de fricción para docentes.

### 1.3 Actores del Sistema
- **Estudiante (`STUDENT`)**: Consume contenido, interactúa con el chatbot, rinde diagnósticos y exámenes, consume créditos freemium y suscribe membresías.
- **Docente (`TEACHER`)**: Diseña cursos, lecciones con videos de YouTube y bancos de preguntas; analiza estadísticas de dificultad estudiantil.
- **Administrador (`ADMIN`)**: Audita usuarios, suscripciones y transacciones de la plataforma.

---

## 2. Historias de Usuario (HU)

### HU-01: Autenticación, Gestión de Identidad, Roles (RBAC) y Usuarios de Prueba
**Como** usuario del sistema (estudiante, docente o administrador),  
**Quiero** registrarme, autenticarme mediante credenciales seguras, disponer de usuarios de prueba presembrados para cada rol y contar con una función de restablecimiento demo para el administrador,  
**Para** acceder a las funcionalidades según mis privilegios y facilitar demostraciones y pruebas continuas.

### HU-02: Gestión Curricular y Contenidos Educativos (Docente en Web)
**Como** docente en la aplicación web,  
**Quiero** crear y organizar cursos en módulos y lecciones, asociando en cada lección la variable del enlace a YouTube, la variable del contexto pedagógico del video y opcionalmente un formulario evaluativo con preguntas y opciones donde marco la correcta,  
**Para** estructurar una oferta pedagógica clara y modular que sirva de base directa para las evaluaciones y el tutor virtual 3D.

### HU-03: Cuestionario Opcional de Recomendación Inicial de Cursos (Onboarding)
**Como** estudiante recién registrado,  
**Quiero** tener la opción (no obligatoria) de responder un breve formulario de 3 a 5 preguntas con incisos basado en los cursos y temas de la plataforma,  
**Para** recibir una recomendación inmediata con un botón directo hacia el curso o lección que mejor se adapte a lo que me gustaría aprender, sin consumir mis créditos.

### HU-04: Generación Algorítmica de Rutas de Aprendizaje Adaptativas
**Como** estudiante con diagnóstico completado,  
**Quiero** que la IA sintetice una Ruta de Aprendizaje Personalizada secuenciando los módulos y lecciones existentes en la plataforma,  
**Para** avanzar únicamente por los contenidos relevantes que resuelven mis brechas cognitivas.

### HU-05: Consumo de Lecciones, Registro de Progreso y Sincronización Móvil
**Como** estudiante,  
**Quiero** acceder a las lecciones de un curso o de mi ruta adaptativa, ver el video de YouTube, descargar recursos y registrar mi avance,  
**Para** aprender a mi propio ritmo incluso sincronizando datos desde la aplicación móvil.

### HU-06: Evaluaciones Modulares, Calificación y Retroalimentación con IA
**Como** estudiante que culmina un módulo o lección,  
**Quiero** rendir un examen de comprobación y recibir retroalimentación explicativa con IA sobre mis fallos,  
**Para** saber si domino la materia o qué lecciones específicas debo repasar antes de continuar.

### HU-07: Tutor Virtual Multimodal (Profesor Digital 3D) y Evaluación Interactiva
**Como** estudiante que cursa una lección o requiere validar su comprensión,  
**Quiero** interactuar mediante voz (o texto) con un profesor virtual 3D expresivo (que habla y gesticula) capaz de evaluar mi dominio haciéndome entre 5 y 8 preguntas basadas en la descripción y cuestionarios de la lección,  
**Para** recibir una retroalimentación detallada de mi aprendizaje y un botón de redirección inmediata hacia una lección avanzada o un curso alternativo de la plataforma.

### HU-08: Dashboard General Móvil del Docente y Notificaciones de Inscripción
**Como** docente creador que utiliza la aplicación móvil,  
**Quiero** visualizar un dashboard general con 3 KPIs principales (Total Cursos, Total Alumnos, % Aprobación) y tarjetas de cursos con semáforo pedagógico que destaquen la lección más crítica, así como recibir notificaciones push en mi teléfono cada vez que un estudiante se inscribe a mis cursos,  
**Para** supervisar el impacto académico y el crecimiento de mis cursos de forma ágil y sencilla desde el móvil.

### HU-09: Gobernanza Freemium (3 Créditos) y Paywall con Stripe
**Como** estudiante con cuenta nueva,  
**Quiero** disponer de 3 créditos gratuitos para abrir lecciones y, una vez agotados, contar con un flujo de pago seguro vía Stripe,  
**Para** comprobar la efectividad de la plataforma antes de adquirir una suscripción ilimitada.

---

## 3. Requisitos Funcionales (RF con Sintaxis EARS)

### Módulo HU-01: Autenticación, RBAC y Usuarios de Prueba
- **`RF-01.1` [Event-Driven]**: CUANDO un usuario se registra enviando nombre, correo único, contraseña y rol deseado, el sistema deberá persistir las credenciales con hash criptográfico (`bcrypt`/`argon2`) y asignar el rol verificado.
- **`RF-01.2` [Event-Driven]**: CUANDO un usuario autenticado inicia sesión con credenciales válidas, el sistema deberá emitir un `AccessToken` JWT de corta duración y un `RefreshToken` seguro.
- **`RF-01.3` [Unwanted Behavior]**: SI las credenciales son inválidas o el correo ya se encuentra registrado, ENTONCES el sistema deberá rechazar la solicitud con código HTTP 401/409 y mensaje normalizado RFC 7807 sin revelar detalles sensibles.
- **`RF-01.4` [Ubiquitous]**: El sistema deberá proteger los endpoints sensibles mediante guardias de autorización que validen roles (`STUDENT`, `TEACHER`, `ADMIN`).
- **`RF-01.5` [Ubiquitous]**: El sistema deberá incluir usuarios de prueba presembrados (`prisma/seed.ts`) para cada rol: `student@test.com` (con 3 créditos iniciales), `teacher@test.com` (con cursos y lecciones demo asociados) y `admin@test.com`, todos con contraseña uniforme `Password123!`.
- **`RF-01.6` [Event-Driven]**: CUANDO un administrador solicita restablecer los datos de prueba (`POST /api/v1/admin/reset-demo-data`), el sistema deberá reiniciar el balance de créditos a 3 y limpiar el progreso de los usuarios demo para permitir demostraciones y pruebas repetibles.

### Módulo HU-02: Gestión Curricular (Cursos, Módulos y Lecciones)
- **`RF-02.1` [Event-Driven]**: CUANDO un docente registra un curso, el sistema deberá validar título, descripción, categoría y estado (borrador/publicado), asociándolo a su identificador de docente.
- **`RF-02.2` [Unwanted Behavior / Fallback]**: SI el catálogo de categorías está vacío al crear un curso, ENTONCES el sistema deberá permitir una categoría neutra ("General") o permitir el aprovisionamiento de la categoría en caliente.
- **`RF-02.3` [Event-Driven]**: CUANDO un docente crea o edita una lección en la aplicación web (`POST/PUT /api/v1/modules/:id/lessons`), el sistema deberá validar que la URL pertenezca al dominio canónico de YouTube (mediante patrón regex), registrar el orden secuencial, almacenar la variable de contexto pedagógico del video (`contextText`) y admitir un enlace placeholder para el material descargable.
- **`RF-02.4` [Event-Driven]**: CUANDO un docente solicita dar de baja un curso (`PATCH /api/v1/courses/:id/archive`), si existen estudiantes inscritos el sistema deberá aplicar soft-delete (estado `ARCHIVED`), manteniéndolo visible en la lista del estudiante en modo tenue/deshabilitado y sin botón de ingreso; si el curso carece de inscritos, se permitirá su eliminación física en cascada (`CASCADE`).
- **`RF-02.5` [State-Driven / Opcional]**: MIENTRAS el docente crea o edita una lección en la interfaz web, el sistema deberá permitirle opcionalmente agregar y estructurar el formulario evaluativo de la lección mediante componentes dinámicos de preguntas, donde el docente establece el texto de la pregunta, múltiples opciones de respuesta y marca mediante un selector la única opción correcta.
- **`RF-02.6` [State-Driven / Jerarquía y Persistencia Visual Docente]**: En la interfaz web, el docente gestionará sus contenidos bajo la jerarquía estricta Curso $\to$ Temario de Lecciones $\to$ Formulario Evaluativo. Al ingresar a "Mis Cursos Creados", podrá crear un nuevo curso o seleccionar uno existente; dentro del curso seleccionado visualizará el listado ordenado de lecciones ya persistidas y el botón "+ Añadir Lección". Al guardar una lección con su enlace de YouTube, contexto del video y formulario opcional, el sistema la asociará al curso activo y la mostrará inmediatamente en el listado del curso.

### Módulo HU-03: Cuestionario Opcional de Recomendación Inicial de Cursos (Onboarding)
- **`RF-03.1` [State-Driven]**: AL REGISTRARSE un nuevo estudiante, el sistema deberá presentar en la pantalla de bienvenida la opción no obligatoria de responder un cuestionario de recomendación ("Descubre qué aprender") o la alternativa de omitir y navegar directamente al catálogo general.
- **`RF-03.2` [Event-Driven]**: CUANDO el estudiante inicia el cuestionario (`GET /api/v1/recommendations/quiz`), el sistema deberá generar un formulario simple de 3 a 5 preguntas con incisos de opción múltiple elaborado a partir de los títulos, descripciones y categorías de todos los cursos registrados en la plataforma.
- **`RF-03.3` [Ubiquitous]**: El cuestionario de recomendación inicial será 100% gratuito y no deducirá créditos del saldo del estudiante.
- **`RF-03.4` [Event-Driven]**: CUANDO el estudiante envía sus respuestas (`POST /api/v1/recommendations/quiz/submit`), el sistema deberá determinar el curso o primera lección más afín, registrar la inscripción del alumno y retornar un objeto con la recomendación destacada y un botón/enlace de redirección inmediata (`redirectUrl`) para ingresar a dicho curso o lección sin fricción.

### Módulo HU-04: Motor de Rutas Adaptativas (Google Gemini)
- **`RF-04.1` [Event-Driven]**: CUANDO el estudiante envía las respuestas del cuestionario de recomendación inicial (`POST /api/v1/recommendations/quiz/submit`), el sistema deberá invocar a Google Gemini API para analizar su afinidad y compilar automáticamente una `LearningPath` adaptativa secuenciando exclusivamente módulos y lecciones existentes en la plataforma.
- **`RF-04.2` [State-Driven]**: MIENTRAS se procesa la inferencia diagnóstica, el sistema deberá mapear las debilidades exclusivamente contra el catálogo de módulos y lecciones existentes en la plataforma, generando una `LearningPath` ordenada y persistida.
- **`RF-04.3` [Unwanted Behavior]**: SI el servicio de Google Gemini API no responde o agota su cuota (HTTP 429), ENTONCES el sistema deberá activar un algoritmo de contingencia heurístico que asigne la ruta básica por defecto e intente un reintento asíncrono con backoff exponencial.

### Módulo HU-05: Consumo de Lecciones, Progreso, Temario y Sincronización
- **`RF-05.1` [Event-Driven]**: CUANDO un estudiante solicita abrir una lección, el sistema deberá verificar si ya fue desbloqueada previamente; si ya está desbloqueada, autorizará el acceso sin costo; si es el primer acceso, verificará que posea al menos 1 crédito (o suscripción activa), deducirá 1 crédito y registrará el desbloqueo permanente para ese estudiante.
- **`RF-05.2` [Unwanted Behavior]**: SI el estudiante no dispone de créditos y carece de suscripción activa al intentar abrir una lección por primera vez, ENTONCES el sistema deberá bloquear la entrega con código HTTP 402 y responder con las opciones de checkout.
- **`RF-05.3` [Event-Driven]**: El progreso de una lección se marcará como completado mediante acción voluntaria del estudiante ("Marcar como Completada") o de forma automática cuando el alumno apruebe el examen o la evaluación del tutor de dicha lección.
- **`RF-05.4` [Event-Driven]**: CUANDO un cliente móvil remite una sincronización masiva (`POST /api/v1/progress/sync-batch`), el sistema deberá procesar el lote dentro de una transacción atómica actualizando el estado de cada lección informada.
- **`RF-05.5` [Event-Driven / Exploración Pre-Inscripción de Cursos]**: Al hacer clic en un curso del catálogo general, el estudiante ingresará a la vista de detalle del curso (`#/courses/:id`) para visualizar su descripción, el nombre del docente y el temario de lecciones disponibles; si el estudiante no está inscrito, se presentará el botón "Inscribirme al Curso" que ejecutará la matrícula (`POST /api/v1/courses/:id/enroll`) y habilitará el acceso a abrir las lecciones del curso.

### Módulo HU-10: Sincronización de Navegación e Historial de Navegador (Flecha Atrás)
- **`RF-10.1` [State-Driven / Historial de Navegación]**: La aplicación web sincronizará el estado de navegación con el historial del navegador mediante Hash Routing (`#/courses`, `#/courses/:id`, `#/lessons/:id`), de modo que al pulsar la flecha "Atrás" o "Adelante" del navegador, el usuario regresará fluidamente a la pantalla precedente (de lección a detalle de curso, y de detalle a catálogo general) sin recargar la página ni ser expulsado de la aplicación.

- **`RF-06.1` [Event-Driven]**: CUANDO un docente crea o edita el formulario evaluativo de una lección o módulo, el sistema deberá permitir definir preguntas donde el docente establece el enunciado y múltiples opciones de respuesta, marcando una única opción como correcta con su ponderación.
- **`RF-06.2` [Event-Driven]**: CUANDO un estudiante rinde el formulario evaluativo, el sistema registrará la opción seleccionada mediante un solo clic en la interfaz web (Answer Tile), validando de forma determinista su corrección y calculando la calificación matemática final para contrastarla contra el umbral de aprobación (70%).
- **`RF-06.3` [Event-Driven]**: CUANDO el estudiante reprueba o finaliza el examen, el sistema deberá remitir las preguntas fallidas a Google Gemini API para que genere un diagnóstico pedagógico y recomiende lecciones específicas de repaso.
- **`RF-06.4` [Ubiquitous]**: Los reintentos de exámenes modulares serán libres y no deducirán créditos del saldo del estudiante; el sistema registrará cada intento de forma inmutable y conservará la calificación más alta obtenida.

### Módulo HU-07: Tutor Virtual Multimodal (Profesor Digital 3D) y Evaluación Interactiva
- **`RF-07.1` [State-Driven]**: AL INICIAR una sesión de tutoría (`POST /api/v1/tutor/sessions`), el sistema deberá cargar y contextualizar el agente de IA integrando simultáneamente la descripción manual de la lección y el banco de preguntas/formularios configurados por los docentes para dicho contenido.
- **`RF-07.2` [Event-Driven]**: MIENTRAS se desarrolla la sesión, el tutor virtual deberá conducir una evaluación oral/conversacional formulando un rango dinámico de 5 a 8 preguntas adaptadas secuencialmente según las respuestas emitidas por el alumno.
- **`RF-07.3` [Ubiquitous]**: El sistema deberá soportar comunicación multimodal simétrica: admitir la entrada del estudiante prioritariamente por voz (procesada mediante Speech-to-Text) con soporte alternativo de entrada por texto, y proveer la respuesta del profesor virtual mediante audio sintetizado (Text-to-Speech) y metadatos de sincronización de visemas/blendshapes para la gesticulación expresiva del modelo 3D.
- **`RF-07.4` [Event-Driven]**: CUANDO se completan las 5-8 preguntas o el estudiante solicita terminar la evaluación oral (`POST /api/v1/tutor/sessions/:id/finish`), el sistema deberá emitir un informe detallado con el puntaje cuantitativo y el diagnóstico cualitativo del desempeño.
- **`RF-07.5` [Event-Driven]**: JUNTO al informe final de evaluación, el sistema deberá generar una recomendación prescriptiva que retorne un objeto de acción para renderizar un botón directo en el cliente, habilitando una ruta inmediata hacia una lección avanzada recomendada o hacia otro curso/lección relevante dentro del catálogo general de la plataforma.

### Módulo HU-08: Dashboard General Móvil del Docente y Notificaciones Push
- **`RF-08.1` [Event-Driven]**: CUANDO un docente consulta su dashboard general móvil (`GET /api/v1/teacher/dashboard`), el sistema deberá retornar los 3 KPIs superiores consolidados (`totalCourses`, `totalStudents`, `overallPassRatePercentage`) junto con el listado de sus cursos, donde cada curso incluye su total de inscritos, semáforo de estado pedagógico (`leaf` para >80%, `sun` para 60-80%, `coral` para <60%) y la lección con mayor tasa de error para intervención directa.
- **`RF-08.2` [Event-Driven]**: CUANDO un docente registra el token de su dispositivo móvil (`POST /api/v1/teacher/device-token`), el sistema asociará el token de dispositivo al usuario docente para posibilitar el envío de alertas push.
- **`RF-08.3` [Event-Driven]**: CUANDO un estudiante se inscribe a un curso (`Enrollment`), el sistema despachará de forma inmediata una notificación push directa y efímera al dispositivo móvil del docente creador informando el nombre del nuevo alumno y el título del curso.
- **`RF-08.4` [Event-Driven]**: CUANDO un docente consulta las analíticas de detalle de un curso (`GET /api/v1/analytics/courses/:id/difficulty`), el sistema agregará los intentos de examen y calculará la tasa de error por pregunta y por lección.
- **`RF-08.5` [Ubiquitous]**: El sistema deberá identificar automáticamente los temas con tasa de error superior al 40% y destacarlos en el reporte como "Puntos Críticos de Fricción".

### Módulo HU-09: Billetera Freemium y Pasarela Stripe (Developer Mode Educativo)
- **`RF-09.1` [Event-Driven]**: CUANDO un usuario se registra con rol `STUDENT`, el sistema deberá inicializar automáticamente su `CreditAccount` con un saldo exacto de 3 créditos.
- **`RF-09.2` [Event-Driven]**: CUANDO el estudiante solicita contratar la suscripción ilimitada, el sistema deberá interactuar con la API de Stripe en modo desarrollador (`sk_test_...`) para generar una `CheckoutSession` educativa compatible con la tarjeta de prueba estándar `4242 4242 4242 4242`.
- **`RF-09.3` [Event-Driven]**: CUANDO el backend recibe el evento `checkout.session.completed` firmado por Stripe, el sistema deberá verificar la firma, registrar el ID de evento para prevenir duplicados y activar el registro de suscripción ilimitada del alumno.

---

## 4. Criterios de Aceptación y Escenarios BDD (Gherkin)

### Escenarios de HU-01 (Autenticación, RBAC y Usuarios de Prueba)

#### SC-01.1.1: Registro exitoso de estudiante con 3 créditos iniciales
```gherkin
Given que no existe un usuario registrado con el correo "alumno@test.com"
When el usuario envía una solicitud POST a "/api/v1/auth/register" con nombre, correo, contraseña y rol "STUDENT"
Then el sistema responde con código HTTP 201 Created
And el usuario queda registrado en la base de datos con su contraseña encriptada
And se crea automáticamente su cuenta de créditos con un saldo inicial de 3
```

#### SC-01.1.2: Intento de registro con correo duplicado
```gherkin
Given que ya existe un usuario registrado con el correo "profesor@test.com"
When un usuario intenta registrarse mediante POST a "/api/v1/auth/register" con el mismo correo
Then el sistema responde con código HTTP 409 Conflict
And la respuesta contiene un mensaje de error explicativo sin exponer detalles internos
```

#### SC-01.1.3: Restablecimiento administrativo de usuarios de prueba
```gherkin
Given que el usuario autenticado posee el rol "ADMIN"
And los usuarios demo "student@test.com" y "teacher@test.com" han modificado sus créditos o cursos
When el administrador envía un POST a "/api/v1/admin/reset-demo-data"
Then el sistema restaura el balance del estudiante de prueba a 3 créditos exactos
And restablece los datos demo a su configuración original
And responde con código HTTP 200 OK y confirmación de restablecimiento
```

---

### Escenarios de HU-02 (Gestión Curricular Docente)

#### SC-02.1.1: Creación de curso con categoría existente
```gherkin
Given que un usuario autenticado posee el rol "TEACHER"
And existe una categoría "Desarrollo Web" en el catálogo
When el docente envía un POST a "/api/v1/courses" con título "Curso NestJS", categoría "Desarrollo Web" y descripción
Then el sistema responde con código HTTP 201 Created
And el curso queda asociado al identificador del docente
```

#### SC-02.1.2: Creación de lección en web con enlace de YouTube, contexto del video y formulario evaluativo opcional
```gherkin
Given que el docente es propietario de un módulo en un curso
When envía un POST a "/api/v1/modules/:id/lessons" con:
  | title        | "Introducción a React"                                                                                                |
  | videoUrl     | "https://www.youtube.com/watch?v=dQw4w9WgXcQ"                                                                         |
  | contextText  | "En este video se abordan componentes, JSX y renderizado reactivo para la web"                                        |
  | order        | 1                                                                                                                     |
  | examForm     | [{"text": "¿Qué es JSX?", "options": [{"text": "Extensión de sintaxis JS", "isCorrect": true}, {"text": "CSS puro", "isCorrect": false}]}] |
Then el sistema responde con código HTTP 201 Created
And valida exitosamente el formato canónico de YouTube
And almacena la variable de contexto del video y el formulario evaluativo opcional asociado a la lección
And asigna un enlace placeholder para el material descargable
```

#### SC-02.1.3: Baja de curso con estudiantes inscritos aplica soft-delete y modo inactivo
```gherkin
Given que un curso cuenta con estudiantes formalmente inscritos
When el docente envía un PATCH a "/api/v1/courses/:id/archive"
Then el sistema actualiza el estado del curso a "ARCHIVED" (soft-delete)
And el curso sigue apareciendo en el panel del estudiante inscrito pero en modo tenue/deshabilitado y sin botón de ingreso
```

#### SC-02.1.4: Gestión jerárquica de curso, creación de lección y visualización dentro del curso
```gherkin
Given que un docente autenticado accede a la vista "Mis Cursos Creados"
When selecciona un curso existente o crea uno nuevo mediante POST a "/api/v1/courses"
Then el sistema visualiza la pantalla del curso con su lista de lecciones creadas
When el docente presiona "+ Añadir Lección" y completa el formulario con video de YouTube, contexto pedagógico y evaluación opcional
Then la lección queda guardada y vinculada a dicho curso
And se visualiza de forma inmediata en el temario del curso para confirmación del docente
```

---

### Escenarios de HU-03 (Cuestionario Opcional de Recomendación Inicial)

#### SC-03.1.1: Estudiante nuevo completa el cuestionario opcional y es redirigido a un curso afín
```gherkin
Given que un nuevo estudiante recién registrado inicia sesión
And visualiza en pantalla la opción no obligatoria "Descubre qué aprender"
When el estudiante solicita el cuestionario enviando GET a "/api/v1/recommendations/quiz"
Then el sistema retorna un formulario de 3 a 5 preguntas con incisos de selección múltiple basados en los cursos activos
When el estudiante envía sus respuestas mediante POST a "/api/v1/recommendations/quiz/submit"
Then el sistema determina la afinidad del estudiante hacia el curso más afín
And inscribe automáticamente al estudiante en dicho curso
And compila la Ruta de Aprendizaje Personalizada con Google Gemini API
And el saldo de créditos se mantiene en 3 (cero costo de créditos)
And responde con código HTTP 200 OK incluyendo la recomendación y el botón directo con "redirectUrl" hacia el curso o lección
```

#### SC-03.1.2: Estudiante decide omitir el cuestionario y navegar directamente al catálogo
```gherkin
Given que un nuevo estudiante visualiza la pantalla de bienvenida con la opción de recomendación
When el estudiante presiona "Omitir y ver catálogo"
Then el sistema no genera cuestionario ni deduce créditos
And permite al estudiante navegar libremente por el listado general de cursos de la plataforma
```

---

### Escenarios de HU-05 y HU-09 (Consumo Freemium, Paywall y Stripe)

#### SC-05.1.1: Apertura inicial con deducción de 1 crédito y posterior reapertura sin costo (desbloqueo permanente)
```gherkin
Given que el estudiante tiene un saldo de 3 créditos y ninguna suscripción activa
When solicita acceder por primera vez a una lección enviando GET a "/api/v1/lessons/:id"
Then el sistema autoriza el acceso entregando los metadatos y URL de YouTube
And el saldo de créditos del estudiante disminuye a 2
And el sistema registra la lección como desbloqueada permanentemente para ese estudiante
When el estudiante vuelve a acceder a la misma lección posteriormente
Then el sistema autoriza el acceso inmediatamente sin deducir créditos adicionales
```

#### SC-05.1.2: Apertura de lección bloqueada por Paywall (Saldo 0)
```gherkin
Given que el estudiante tiene 0 créditos disponibles y no cuenta con suscripción activa
When solicita acceder por primera vez a una lección no desbloqueada enviando GET a "/api/v1/lessons/:id"
Then el sistema rechaza la solicitud con código HTTP 402 Payment Required
And la respuesta contiene el enlace para iniciar el checkout de suscripción con Stripe
```

#### SC-05.1.3: Completitud de lección por acción manual o aprobación evaluativa
```gherkin
Given que el estudiante tiene una lección desbloqueada
When el estudiante presiona "Marcar como Completada" o aprueba el examen o tutoría de dicha lección
Then el sistema registra el progreso de la lección como completado de forma atómica e idempotente
```

#### SC-09.3.1: Activación de suscripción ilimitada mediante Webhook de Stripe (Test Mode con tarjeta 4242)
```gherkin
Given que un estudiante con 0 créditos inició una sesión de pago en Stripe Developer Mode
When completa el pago utilizando la tarjeta de prueba oficial "4242 4242 4242 4242"
And el backend recibe un evento POST a "/api/v1/payments/webhook" con el payload "checkout.session.completed" y firma válida
Then el sistema valida la firma criptográfica con el secreto del webhook de prueba
And registra el evento como procesado para garantizar idempotencia
And activa la suscripción del estudiante a estado "ACTIVE"
And en las subsiguientes aperturas de lecciones no se deducen créditos
```

#### SC-05.1.4: Exploración de temario de curso antes de inscribirse y posterior acceso a lección
```gherkin
Given que un estudiante consulta el catálogo de cursos
When hace clic en un curso para ingresar a su detalle ("#/courses/:id")
Then el sistema visualiza la información del curso, el docente y la lista de lecciones del temario
And si el estudiante no está inscrito, muestra el botón "Inscribirme al Curso"
When el estudiante pulsa "Inscribirme al Curso"
Then el sistema registra su matrícula mediante POST a "/api/v1/courses/:id/enroll"
And habilita los botones para abrir y cursar las lecciones del curso
```

---

### Escenarios de HU-10 (Sincronización de Navegación con Historial de Navegador)

#### SC-10.1.1: Navegación con botón Atrás del navegador preservando contexto
```gherkin
Given que un usuario navega desde el catálogo general al detalle de un curso ("#/courses/:id") y luego a una lección ("#/lessons/:id")
When el usuario presiona el botón "Atrás" del navegador web
Then la aplicación web intercepta el evento "popstate" / cambio de hash
And navega fluidamente a la vista de detalle del curso ("#/courses/:id")
And mantiene la sesión activa sin recargar la página ni expulsar al usuario
When el usuario vuelve a presionar el botón "Atrás"
Then la aplicación regresa a la vista de catálogo general ("#/courses")
```

---

### Escenarios de HU-06 (Evaluaciones y Recomendación de Repaso)

#### SC-06.1.1: Examen modular reprobado activa sugerencias de repaso
```gherkin
Given que un estudiante rinde un examen con umbral de 70% configurado con preguntas de opción múltiple
When selecciona sus opciones de respuesta mediante un solo clic en la interfaz y envía el intento obteniendo un puntaje de 50%
Then el sistema marca el examen como no aprobado
And procesa las respuestas erróneas con Google Gemini API
And retorna un análisis explicativo indicando los conceptos débiles y prescribiendo las lecciones específicas a repasar
```

#### SC-06.1.2: Reintento de examen sin costo de créditos y conservación de nota máxima
```gherkin
Given que un estudiante obtuvo un 50% en su primer intento de examen
When envía un segundo intento obteniendo un 85% mediante POST a "/api/v1/exams/:id/submit"
Then el sistema registra el nuevo intento sin deducir créditos
And actualiza el registro oficial del estudiante con la nota más alta (85%)
And marca el examen como aprobado
```

---

### Escenarios de HU-07 (Tutor Virtual 3D y Evaluación Interactiva)

#### SC-07.1.1: Inicialización contextualizada del Tutor Virtual para una lección
```gherkin
Given que una lección posee la variable de contexto del video redactada por el docente
And posee un formulario evaluativo con preguntas y opciones configuradas
When el estudiante inicia una sesión de tutoría enviando POST a "/api/v1/tutor/lessons/:id/sessions"
Then el sistema crea una sesión de tutoría activa contextualizada con el video y las preguntas
And la IA genera la primera pregunta oral del ciclo evaluativo (1 de 5 a 8)
And la respuesta incluye texto, URL de audio sintetizado (TTS) y visemas para la gesticulación del avatar 3D
And responde con código HTTP 201 Created
```

#### SC-07.2.1: Flujo evaluativo multimodal (voz primordial y alternativa texto)
```gherkin
Given que la sesión de tutoría se encuentra en curso en la pregunta 3
When el estudiante envía su respuesta enviando audio (voz) o texto mediante POST a "/api/v1/tutor/sessions/:id/interact"
Then el sistema procesa el audio mediante Speech-to-Text (o lee el texto alternativo)
And Gemini evalúa la pertinencia de la respuesta y formula la siguiente pregunta adaptativa
And la respuesta entrega la nueva pregunta con audio y parámetros de sincronización gestual
```

#### SC-07.3.1: Finalización evaluativa con reporte detallado y botón de redirección de ruta
```gherkin
Given que el estudiante ha respondido la secuencia de preguntas (entre 5 y 8) planteadas por el tutor
When el estudiante o el tutor concluyen la evaluación enviando POST a "/api/v1/tutor/sessions/:id/finish"
Then el sistema procesa el resumen evaluativo y calcula el puntaje y fortalezas/debilidades
And determina la recomendación: avanzar a una lección avanzada recomendada o repasar otro curso/lección de la plataforma
And retorna un payload con "scoreReport" y un objeto "actionButton" con etiqueta, targetId y targetType para generar el botón de navegación en la interfaz
And responde con código HTTP 200 OK
```

---

### Escenarios de HU-08 (Dashboard General Móvil y Notificaciones Docente)

#### SC-08.1.1: Visualización de métricas de dificultad docente por curso
```gherkin
Given que un docente es propietario del curso "Curso NestJS"
And múltiples estudiantes han rendido evaluaciones en sus módulos
When el docente envía un GET a "/api/v1/analytics/courses/:id/difficulty"
Then el sistema retorna un listado de lecciones y preguntas agregadas por porcentaje de fallo
And resalta aquellas con más del 40% de reprobación como puntos críticos de dificultad
```

#### SC-08.1.2: Consulta de Dashboard General Móvil del Docente (3 KPIs y Semáforo)
```gherkin
Given que un docente autenticado con rol "TEACHER" accede desde la aplicación móvil
When solicita su dashboard general enviando GET a "/api/v1/teacher/dashboard"
Then el sistema responde con código HTTP 200 OK
And entrega los 3 KPIs: "totalCourses", "totalStudents" y "overallPassRatePercentage"
And entrega la lista de cursos con su semáforo de estado ("leaf", "sun", "coral") y la lección con mayor tasa de error
```

#### SC-08.1.3: Notificación push directa al móvil del docente ante nueva inscripción
```gherkin
Given que el docente registró el token de su teléfono mediante POST a "/api/v1/teacher/device-token"
When un nuevo estudiante se inscribe al curso mediante POST a "/api/v1/recommendations/quiz/submit" o inscripción directa
Then el sistema despacha una notificación push directa y efímera al dispositivo móvil del docente
And el mensaje informa: "¡Nuevo estudiante! [Nombre] se ha inscrito a tu curso [Título]"
```

---

## 5. Datos Funcionales del Módulo (Entradas y Salidas)

### 5.1 Datos de Entrada

| Endpoint | Parámetro | Tipo Funcional | Requerido | Regla de Negocio / Fallback ante Catálogo Vacío |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/auth/register` | `email` | String | Sí | Formato RFC 5322 único en la base de datos |
| `POST /api/v1/auth/register` | `password` | String | Sí | Mínimo 8 caracteres, al menos 1 número y 1 mayúscula |
| `POST /api/v1/auth/register` | `role` | Enum | Sí | `STUDENT`, `TEACHER`, `ADMIN` |
| `POST /api/v1/courses` | `title` | String | Sí | 5 a 120 caracteres |
| `PATCH /api/v1/courses/:id/archive` | `courseId` (Path) | UUID | Sí | Soft-delete del curso; si tiene alumnos inscritos pasa a `ARCHIVED` inactivo |
| `POST /api/v1/admin/reset-demo-data` | N/A | None | No | Requiere rol `ADMIN`; restablece datos demo para defensas y pruebas |
| `GET /api/v1/recommendations/quiz` | N/A | None | No | Cuestionario breve (3-5 preguntas) generado desde los cursos activos |
| `POST /api/v1/recommendations/quiz/submit` | `answers` | Array<Object> | Sí | Respuestas del estudiante: `[{ questionId: string, optionIndex: number }]` |
| `POST /api/v1/modules/:id/lessons` | `title` | String | Sí | Título de la lección (3 a 120 caracteres) |
| `POST /api/v1/modules/:id/lessons` | `videoUrl` | String (URL) | Sí | Expresión regular canónica de YouTube (`youtube.com` o `youtu.be`) |
| `POST /api/v1/modules/:id/lessons` | `contextText` | String | Sí | Variable de contexto del video (alimenta al tutor virtual y evaluaciones) |
| `POST /api/v1/modules/:id/lessons` | `downloadableUrl` | String (URL) | No | Si se omite, se establece enlace placeholder de recurso complementario |
| `POST /api/v1/modules/:id/lessons` | `examForm` | Object | No | Formulario evaluativo opcional: `{ questions: [{ text, options: [{ text, isCorrect }] }] }` |
| `POST /api/v1/progress/sync-batch` | `items` | Array<Object> | Sí | Lote con `{ lessonId: UUID, completed: Boolean, timestamp: ISO8601 }` |
| `POST /api/v1/exams/:id/submit` | `answers` | Array<Object> | Sí | Lista de pares `{ questionId: UUID, selectedOptionId: UUID }` |
| `POST /api/v1/tutor/lessons/:id/sessions` | `lessonId` (Path) | UUID | Sí | Valida que la lección exista y carga su descripción y formularios |
| `POST /api/v1/tutor/sessions/:id/interact` | `audioBase64` | String (Base64) | No* | Audio con la voz del estudiante (modo primordial) |
| `POST /api/v1/tutor/sessions/:id/interact` | `textMessage` | String | No* | Alternativa en texto (*Debe enviarse `audioBase64` o `textMessage`) |
| `POST /api/v1/tutor/sessions/:id/finish` | N/A | None | No | Concluye la evaluación oral y genera el veredicto y sugerencia |
| `GET /api/v1/teacher/dashboard` | N/A | None | No | Requiere rol `TEACHER`; retorna 3 KPIs y semáforo de cursos |
| `POST /api/v1/teacher/device-token` | `token` | String | Sí | Registra el token de dispositivo móvil para notificaciones push |

### 5.2 Datos de Salida / Observables

| Endpoint / Evento | Dato Observado | Tipo Funcional | Descripción del Contrato |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/auth/login` | `tokens` | Object | `{ accessToken: string, refreshToken: string, user: { id, email, role } }` |
| `GET /api/v1/teacher/dashboard` | `teacherDashboard` | Object | `{ kpis: { totalCourses: number, totalStudents: number, overallPassRatePercentage: number }, courses: [{ id: UUID, title: string, enrolledCount: number, statusColor: "leaf" \| "sun" \| "coral", criticalLesson?: { id: UUID, title: string, failureRate: number } }] }` |
| `POST /api/v1/teacher/device-token` | `tokenResult` | Object | `{ success: true, message: "Token registrado correctamente" }` |
| `PATCH /api/v1/courses/:id/archive` | `archiveResult` | Object | `{ id: UUID, status: "ARCHIVED", message: "Curso dado de baja exitosamente" }` |
| `POST /api/v1/admin/reset-demo-data` | `resetResult` | Object | `{ success: true, message: string, restoredUsers: ["student@test.com", "teacher@test.com"] }` |
| `GET /api/v1/recommendations/quiz` | `quizPayload` | Object | `{ questions: [{ id: string, text: string, options: string[] }] }` |
| `POST /api/v1/recommendations/quiz/submit` | `recommendation` | Object | `{ courseId: UUID, courseTitle: string, lessonId?: UUID, redirectUrl: string, learningPathId: UUID, actionButton: { label: string, url: string } }` |
| `GET /api/v1/lessons/:id` | `lessonPayload` | Object | `{ id, title, videoUrl, downloadableUrl, creditsRemaining: number, isUnlocked: boolean }` |
| `GET /api/v1/lessons/:id` (Saldo 0) | `paywallNotice` | Object (HTTP 402) | `{ error: "PAYMENT_REQUIRED", checkoutUrl: string, message: string }` |
| `POST /api/v1/tutor/sessions/:id/interact` | `tutorResponse` | Object | `{ questionText: string, audioUrl: string, visemes: Array<{ time: number, shape: string, weight: number }>, questionNumber: number, totalQuestions: number }` |
| `POST /api/v1/tutor/sessions/:id/finish` | `tutorEvaluationReport` | Object | `{ scoreReport: { totalQuestions: number, correctAnswers: number, scorePercentage: number, strengths: string[], weaknesses: string[] }, actionButton: { label: string, targetType: "LESSON" \| "COURSE", targetId: UUID, routeUrl: string } }` |
| `GET /api/v1/analytics/courses/:id/difficulty` | `frictionReport` | Array<Object> | `[{ lessonId, lessonTitle, failureRatePercentage, isCritical: boolean }]` |
